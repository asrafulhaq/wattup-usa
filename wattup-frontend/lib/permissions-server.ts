import 'server-only';

import {
    NO_PERMISSIONS,
    Permission,
    Role,
    ROLE_PERMISSIONS,
    type PermissionSet,
} from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { cache } from 'react';

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

/**
 * The pure resolver. `getEffectivePermissions` below is this over the shared client,
 * memoised for the request; tests call this directly with a stub.
 */
export async function resolvePermissions(
    db: PermissionSource,
    userId: string
): Promise<PermissionSet> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, banned: true, banExpires: true },
    });
    if (!user || isBanned(user)) return NO_PERMISSIONS;

    let defaults: readonly Permission[];
    let overrides: { permission: Permission; granted: boolean }[];
    try {
        const [roleRows, userRows] = await Promise.all([
            db.rolePermission.findMany({
                where: { role: user.role },
                select: { permission: true },
            }),
            db.userPermission.findMany({
                where: { userId },
                select: { permission: true, granted: true },
            }),
        ]);
        defaults = roleRows.map(row => row.permission);
        overrides = userRows;
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
        defaults = ROLE_PERMISSIONS[user.role as Role] ?? [];
        overrides = [];
    }

    const set = new Set<Permission>(defaults);
    for (const override of overrides) {
        if (override.granted) {
            set.add(override.permission);
        } else if (user.role !== Role.SUPER_ADMIN) {
            set.delete(override.permission);
        }
    }
    return set;
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
