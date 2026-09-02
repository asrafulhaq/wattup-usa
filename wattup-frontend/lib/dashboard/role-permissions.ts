import 'server-only';

import { requirePermission } from '@/lib/permission-guard';
import { ALL_ROLES, EDITABLE_PERMISSIONS, Permission, Role } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * What each role holds by default, for the Roles page (checklist 4c.13).
 *
 * The same shape as lib/dashboard/users.ts: a server-only module rather than a server
 * action, so it is reachable only through a server render; an uncached wrapper that does
 * the permission check, because that reads headers and a cached scope may not; and the
 * cached reader underneath, tagged so a change invalidates it.
 *
 * This is display data. It is NOT the authorisation path: every request resolves what
 * its caller may do through lib/permissions-server.ts, which queries role_permission
 * directly and is never cached beyond the one request (4c.16). So a stale read here can
 * at worst draw a stale checkbox for a few seconds; it can never let anyone do anything.
 */

export const ROLE_PERMISSIONS_TAG = 'role-permissions';

/** role -> the permissions role_permission currently grants it. */
export type RolePermissionMatrix = Record<Role, readonly Permission[]>;

async function readMatrix(): Promise<RolePermissionMatrix> {
    'use cache';
    cacheLife({ stale: 30, revalidate: 60, expire: 300 });
    cacheTag(ROLE_PERMISSIONS_TAG);

    const rows = await prisma.rolePermission.findMany({
        select: { role: true, permission: true },
    });

    const byRole = Object.fromEntries(ALL_ROLES.map(role => [role, [] as Permission[]])) as Record<
        Role,
        Permission[]
    >;
    for (const row of rows) {
        // A role the enum no longer contains would have no column to sit under; skip it
        // rather than inventing one. Ordered by the enum, not by the row order, so the
        // page draws the same way whatever the database returns.
        byRole[row.role as Role]?.push(row.permission as Permission);
    }
    for (const role of ALL_ROLES) {
        byRole[role].sort(
            (a, b) => EDITABLE_PERMISSIONS.indexOf(a) - EDITABLE_PERMISSIONS.indexOf(b)
        );
    }
    return byRole;
}

/**
 * The matrix, or null for a caller without MANAGE_PERMISSIONS, so the page says so
 * rather than erroring. The action behind every toggle checks the same permission again.
 */
export async function getRolePermissionMatrix(): Promise<RolePermissionMatrix | null> {
    const authorised = await requirePermission(Permission.MANAGE_PERMISSIONS);
    if (!authorised) return null;
    return readMatrix();
}
