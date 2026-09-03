import 'server-only';

import {
    ALL_PERMISSIONS,
    NO_PERMISSIONS,
    Permission,
    Role,
    ROLE_PERMISSIONS,
    type PermissionSet,
} from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';

import { ROLE_PERMISSIONS_TAG, userPermissionsTag } from '@/lib/cache-tags';

/**
 * Resolves what one user may do right now (ADR 0002 section 7, checklist 4a.6):
 *
 *   role defaults from role_permission for the user's CURRENT role
 *   minus  user_permission rows with granted = false  (never for SUPER_ADMIN, 4a.21)
 *   plus   user_permission rows with granted = true
 *
 * Always from the database, never from the session cookie (4a.10): Better Auth's cookie
 * cache can hold a role for five minutes, and a permission change has to bite on the
 * very next request. Only the caller's id comes from the session.
 *
 * Resolved once per request (4a.9) through React's cache(), which dedupes calls for the
 * same user id within one server render or one server action invocation. Two calls in
 * the same request are one query; the next request queries again.
 */

/** The slice of the client this needs, so a test can hand it a stub. */
export type PermissionSource = Pick<PrismaClient, 'user' | 'rolePermission' | 'userPermission'>;

/**
 * A ban ends the resolution early: a banned user holds nothing, whatever their role
 * says, so a session that outlives the ban is refused everywhere the set is checked.
 * An expired ban is treated as no ban; the admin plugin clears the flag on the next
 * sign in.
 */
function isBanned(user: { banned: boolean | null; banExpires: Date | null }): boolean {
    if (user.banned !== true) return false;
    return user.banExpires === null || user.banExpires.getTime() > Date.now();
}

/**
 * Prisma's "relation does not exist": P2021 from a typed query, or 42P01 surfacing
 * through the pg driver adapter. Nothing else is mistaken for it.
 */
function isMissingTable(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const { code, meta } = error as { code?: unknown; meta?: { code?: unknown } };
    return code === 'P2021' || meta?.code === '42P01';
}

// Reported once per process rather than once per request.
let missingTablesReported = false;

type UserRow = { role: Role; banned: boolean | null; banExpires: Date | null };
type Override = { permission: Permission; granted: boolean };

/** The user's role and ban state, or null when there is no such row. */
async function loadUser(db: PermissionSource, userId: string): Promise<UserRow | null> {
    return db.user.findUnique({
        where: { id: userId },
        select: { role: true, banned: true, banExpires: true },
    });
}

/**
 * Every role's defaults, cached.
 *
 * This is the change that took a dashboard page from four sequential round trips to
 * three. The table is tiny, about seventy rows, and it changes only when somebody edits
 * the Roles page, which invalidates ROLE_PERMISSIONS_TAG. Reading it per request bought
 * nothing and cost a full trip to a database 290ms away, and it could not be run in
 * parallel with the user lookup because it needs the role that lookup returns.
 *
 * Cached across users on purpose: it is the same answer for everybody with that role,
 * and it carries no per-person data.
 */
async function readAllRoleDefaults(): Promise<Record<string, Permission[]>> {
    'use cache';
    cacheTag(ROLE_PERMISSIONS_TAG);
    cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

    const rows = await prisma.rolePermission.findMany({ select: { role: true, permission: true } });
    const byRole: Record<string, Permission[]> = {};
    for (const row of rows) (byRole[row.role] ??= []).push(row.permission as Permission);
    return byRole;
}

/**
 * The two sources of truth for one user: what their role holds by default, and what
 * has been granted or revoked on top of it.
 *
 * `db` is still the injected client for the overrides, which are per user and cannot be
 * cached; the defaults come from the cache above. A test that stubs `rolePermission`
 * still exercises the same arithmetic, because the stub path is kept below for exactly
 * that case.
 */
async function loadGrants(
    db: PermissionSource,
    role: Role,
    userId: string
): Promise<{ defaults: readonly Permission[]; overrides: Override[] }> {
    try {
        // A stub client in a test has no cache scope to read from, and the real one
        // should not pay for the query. Both are served by asking the cache first and
        // falling back to the injected client when it answers nothing for this role.
        const [cachedDefaults, userRows] = await Promise.all([
            db === prisma ? readAllRoleDefaults().catch(() => null) : null,
            db.userPermission.findMany({
                where: { userId },
                select: { permission: true, granted: true },
            }),
        ]);

        if (cachedDefaults) {
            return { defaults: cachedDefaults[role] ?? [], overrides: userRows };
        }

        const roleRows = await db.rolePermission.findMany({
            where: { role },
            select: { permission: true },
        });
        return { defaults: roleRows.map(row => row.permission), overrides: userRows };
    } catch (error) {
        // The one fallback (checklist 4a.6): the code is deployed but the migration
        // that creates the two tables has not run yet. The in-code map is exactly what
        // that migration seeds, so this is the same answer the database will give,
        // minus per-user overrides, which cannot exist without their table either.
        // An empty result from an existing table is NOT a fallback case: a role with
        // no rows holds nothing, on purpose.
        if (!isMissingTable(error)) throw error;
        if (!missingTablesReported) {
            missingTablesReported = true;
            console.error(
                '[permissions] role_permission or user_permission does not exist; answering ' +
                    'from the in-code ROLE_PERMISSIONS map until the rbac_permissions ' +
                    'migration has been applied.',
                error
            );
        }
        return { defaults: ROLE_PERMISSIONS[role] ?? [], overrides: [] };
    }
}

/** role defaults, minus revokes (never for SUPER_ADMIN, 4a.21), plus grants. */
function applyOverrides(
    defaults: readonly Permission[],
    overrides: readonly Override[],
    role: Role
): PermissionSet {
    const set = new Set<Permission>(defaults);
    for (const override of overrides) {
        if (override.granted) {
            set.add(override.permission);
        } else if (role !== Role.SUPER_ADMIN) {
            set.delete(override.permission);
        }
    }
    return set;
}

/**
 * The pure resolver. `getEffectivePermissions` below is this over the shared client,
 * memoised for the request; tests call this directly with a stub.
 */
export async function resolvePermissions(
    db: PermissionSource,
    userId: string
): Promise<PermissionSet> {
    const user = await loadUser(db, userId);
    if (!user || isBanned(user)) return NO_PERMISSIONS;
    const { defaults, overrides } = await loadGrants(db, user.role, userId);
    return applyOverrides(defaults, overrides, user.role);
}

/**
 * The resolved set for a user id, once per request.
 *
 * Every server action and route handler that gates on a permission calls this (through
 * requirePermission) rather than trusting anything handed down to it; a page may pass
 * the same set to the components it renders, since deciding what to draw is not an
 * authorisation decision.
 */
export const getEffectivePermissions = cache(
    async (userId: string): Promise<PermissionSet> => resolvePermissions(prisma, userId)
);

// ─── Provenance ───────────────────────────────────────────────────────────────

/**
 * Why one user holds, or does not hold, one permission (checklist 4c.5, ADR 0001 D14).
 *
 *   fromRole   role_permission has this permission for the role they hold NOW
 *   override   a user_permission row: 'granted' adds it, 'revoked' takes it away
 *   effective  what getEffectivePermissions answers for them on this request
 *
 * The resolved set cannot answer this on its own: MANAGE_LOCATIONS present tells you
 * nothing about whether it came with the role or was granted to this person, and an
 * admin who cannot see the difference cannot predict what a toggle will do.
 */
export interface PermissionDescription {
    permission: Permission;
    fromRole: boolean;
    override: 'granted' | 'revoked' | null;
    effective: boolean;
}

/**
 * The pure describer, over an injected client. Every permission in the enum appears
 * exactly once, in ALL_PERMISSIONS order; an unknown user describes nothing.
 *
 * `effective` is the resolver's answer and nothing else, ban included: a banned user
 * holds nothing whatever their role says, so every row reads effective = false while
 * still showing where the permission would have come from. The screen says so once,
 * rather than each row disagreeing with the ban badge above it.
 */
export async function describePermissions(
    db: PermissionSource,
    userId: string
): Promise<PermissionDescription[]> {
    const user = await loadUser(db, userId);
    if (!user) return [];

    const { defaults, overrides } = await loadGrants(db, user.role, userId);
    const effective = isBanned(user)
        ? NO_PERMISSIONS
        : applyOverrides(defaults, overrides, user.role);

    const roleHolds = new Set<Permission>(defaults);
    // Last row wins if the table ever held two for one pair; the unique index on
    // (userId, permission) means it cannot, and upsert keeps it that way.
    const overridden = new Map<Permission, boolean>(
        overrides.map(row => [row.permission, row.granted])
    );

    return ALL_PERMISSIONS.map(permission => ({
        permission,
        fromRole: roleHolds.has(permission),
        override: overridden.has(permission)
            ? overridden.get(permission)
                ? ('granted' as const)
                : ('revoked' as const)
            : null,
        effective: effective.has(permission),
    }));
}

/**
 * The provenance for one user, for the screens that show it.
 *
 * Cached, unlike getEffectivePermissions above, and the difference matters: that one
 * decides what a request may do and must never be a moment stale, while this one draws
 * a table. Tagged per user and on the role defaults, so a grant, a revoke, a reset, a
 * role change or an edit to a role's defaults all invalidate exactly the pages that
 * showed the old answer. Without this the detail page re-queried on every visit and the
 * viewer watched a skeleton each time.
 *
 * React's cache() still wraps it, so two components on one render share one call.
 */
async function readUserPermissions(userId: string): Promise<PermissionDescription[]> {
    'use cache';
    cacheTag(userPermissionsTag(userId), ROLE_PERMISSIONS_TAG);
    cacheLife({ stale: 30, revalidate: 300, expire: 3600 });
    return describePermissions(prisma, userId);
}

export const describeUserPermissions = cache(
    async (userId: string): Promise<PermissionDescription[]> => readUserPermissions(userId)
);
