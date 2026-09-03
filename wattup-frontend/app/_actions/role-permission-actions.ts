'use server';

import { logActivity } from '@/lib/activity-log';
import { ROLE_PERMISSIONS_TAG } from '@/lib/dashboard/role-permissions';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import { isEditablePermission, isRole, Permission, Role } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { updateTag } from 'next/cache';

/**
 * The one writer for role_permission (ADR 0002 section 10, checklist 4c.13 to 4c.16).
 *
 * The client adjusts role defaults from the dashboard rather than by a migration, so
 * this table is editable. It is also the table every request resolves permissions from,
 * which makes a careless edit the fastest way to lock the product out of its own
 * administration. The guards below are the whole point of the module, in the order they
 * run:
 *
 *   1. the caller holds MANAGE_PERMISSIONS, which by seed is SUPER_ADMIN only;
 *   2. `role` is a real role;
 *   3. `permission` is one the matrix offers: a real enum value, and not one of the six
 *      the code checks nowhere (UNCHECKED_PERMISSIONS in lib/permissions.ts);
 *   4. the SUPER_ADMIN row is locked, in both directions (4c.14). A SUPER_ADMIN who
 *      could remove their own capability could lock every remaining administrator out,
 *      and there is no second SUPER_ADMIN path back in;
 *   5. MANAGE_PERMISSIONS is never removed from the caller's own role (4c.14): an actor
 *      may not remove the permission they are relying on to make the change;
 *   6. MANAGE_PERMISSIONS is never removed from the last role that holds it, counted in
 *      role_permission rather than from the in-code map, because the in-code map is a
 *      fallback and by now the database is the only thing that decides.
 *
 * Every accepted change writes one activity_log row (4c.15) and invalidates the two
 * cached readers whose contents depend on it. Nothing here is cached: getSessionPermissions
 * resolves from role_permission on the next request, so the change bites immediately and
 * with no redeploy, and wattup-proforma sees ACCESS_PROFORMA change through the
 * proforma_member view, which resolves it in SQL (4c.16).
 */

export type RolePermissionResult = { success: true } | { success: false; error: string };

export async function setRolePermission(
    role: Role,
    permission: Permission,
    enabled: boolean
): Promise<RolePermissionResult> {
    const authorised = await requirePermission(Permission.MANAGE_PERMISSIONS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (!isRole(role)) return { success: false, error: 'Unknown role' };
    if (!isEditablePermission(permission)) {
        return { success: false, error: 'That permission is not editable' };
    }

    if (role === Role.SUPER_ADMIN) {
        return {
            success: false,
            error: 'The super admin role holds every permission and cannot be edited.',
        };
    }

    if (!enabled && permission === Permission.MANAGE_PERMISSIONS) {
        if (role === session.role) {
            return {
                success: false,
                error: 'You cannot remove the permission you are using to make this change.',
            };
        }

        // From the database, not from ROLE_PERMISSIONS: the map is only the fallback for
        // a deploy that ships before the migration, and this page's whole purpose is to
        // make the two differ.
        const holders = await prisma.rolePermission.findMany({
            where: { permission: Permission.MANAGE_PERMISSIONS },
            select: { role: true },
        });
        const remaining = holders.filter(row => row.role !== role);
        if (remaining.length === 0) {
            return {
                success: false,
                error: 'At least one role must keep permission management.',
            };
        }
    }

    try {
        if (enabled) {
            // Upsert rather than create: the toggle is idempotent, and a second click on
            // a cell that is already on must not fail on the unique constraint.
            await prisma.rolePermission.upsert({
                where: { role_permission: { role, permission } },
                update: {},
                create: { role, permission },
            });
        } else {
            // deleteMany, so removing a permission the role never held is a no-op rather
            // than a "record not found".
            await prisma.rolePermission.deleteMany({ where: { role, permission } });
        }
    } catch (error) {
        console.error('setRolePermission error:', error);
        return { success: false, error: 'Failed to update the role' };
    }

    // A role change has no user subject: `meta.role` names what changed, and the actor's
    // address stands in the email column, which the schema requires. userId stays null so
    // the row is not read as something that happened to a person.
    await logActivity({
        event: 'role_permission.changed',
        actor: { id: session.id, email: session.email },
        target: { id: null, email: session.email },
        meta: { role, permission, granted: enabled },
    });

    // Every person's provenance table is tagged with this too, so one write here
    // refreshes the Roles page and every user detail page at once.
    updateTag(ROLE_PERMISSIONS_TAG);
    // The team list and the per-user permission view show what a role grants, so they
    // are stale the moment this lands.
    updateTag('users');

    return { success: true };
}
