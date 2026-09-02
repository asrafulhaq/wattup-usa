/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { logActivity } from '@/lib/activity-log';
import { auth } from '@/lib/auth';
import { sendMail } from '@/lib/email';
import { inviteUserTemplate } from '@/lib/mail/invite-user';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import {
    ASSIGNABLE_ROLES,
    canManageRole,
    isPermission,
    Permission,
    Role,
    ROLE_LABELS,
} from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { updateTag } from 'next/cache';

// Every export gates itself with requirePermission, which resolves the caller's set
// from the database on this request. Better Auth's admin plugin then applies its own
// static access control on top (lib/auth.ts); the two agree for role defaults, and
// where a per-user grant would let the app's check pass but the plugin refuse, the
// plugin's error is returned as is.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ManagedUser = {
    id: string;
    name: string;
    email: string;
    role: Role;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
};

const USER_TARGET_SELECT = { id: true, email: true, role: true } as const;

// ─── List users ───────────────────────────────────────────────────────────────

export async function listUsers(options?: {
    search?: string;
    role?: Role;
    page?: number;
    pageSize?: number;
}): Promise<{ success: true; users: ManagedUser[]; total: number } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.VIEW_USERS);
    if (!authorised) return UNAUTHORIZED;

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (options?.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { email: { contains: options.search, mode: 'insensitive' } },
        ];
    }
    if (options?.role) {
        where.role = options.role;
    }

    try {
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    banned: true,
                    banReason: true,
                    banExpires: true,
                    emailVerified: true,
                    image: true,
                    createdAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            success: true,
            users: users.map(u => ({
                ...u,
                banned: u.banned ?? false,
            })) as unknown as ManagedUser[],
            total,
        };
    } catch (err: any) {
        console.error('listUsers error:', err);
        return { success: false, error: 'Failed to fetch users' };
    }
}

// ─── Create (invite) user ─────────────────────────────────────────────────────

/**
 * The role is required and validated here (ADR 0002 section 4.2, checklist 4a.30):
 * it must be one of ASSIGNABLE_ROLES and one the caller outranks, the same rule
 * updateUserRole applies. There is no fallback role anywhere below this.
 */
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    sendInviteEmail?: boolean;
}): Promise<{ success: true; userId: string; emailError?: string } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.INVITE_USERS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (!data.email || !data.password || !data.name) {
        return { success: false, error: 'Name, email, and password are required' };
    }
    if (data.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }
    if (!ASSIGNABLE_ROLES.includes(data.role)) {
        return { success: false, error: 'Choose a role for the new user' };
    }
    if (!canManageRole(session.role, data.role)) {
        return { success: false, error: 'You cannot assign a role equal to or above your own' };
    }

    // Check email uniqueness before creation
    const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (existing) return { success: false, error: 'A user with this email already exists' };

    try {
        const result = await auth.api.createUser({
            body: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role as any,
                data: { emailVerified: true },
            },
            headers: await headers(),
        });

        await logActivity({
            event: 'user.created',
            actor: { id: session.id, email: session.email },
            target: { id: result.user.id, email: data.email },
            meta: { role: data.role },
        });

        let emailError: string | null = null;
        if (data.sendInviteEmail) {
            try {
                await sendInviteEmail({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                    invitedBy: session.name || session.email,
                });
            } catch (mailErr: any) {
                console.error('Invite email failed:', mailErr);
                emailError = 'User created but invite email could not be sent.';
            }
        }

        updateTag('users');
        return { success: true, userId: result.user.id, emailError: emailError ?? undefined };
    } catch (err: any) {
        console.error('createUser error:', err);
        const message = err?.body?.message ?? err?.message ?? 'Failed to create user';
        return { success: false, error: message };
    }
}

// ─── Update user role ─────────────────────────────────────────────────────────

export async function updateUserRole(
    userId: string,
    role: Role
): Promise<{ success: true } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.CHANGE_USER_ROLE);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (session.id === userId) {
        return { success: false, error: 'You cannot change your own role' };
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
        return { success: false, error: 'That role cannot be assigned' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };

    // Both ends of the change are ranked against the actor (checklist 4a.11): the role
    // the user has now, and the role they would get.
    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You cannot change the role of a higher-ranked user' };
    }
    if (!canManageRole(session.role, role)) {
        return { success: false, error: 'You cannot assign a role equal to or above your own' };
    }

    try {
        await auth.api.setRole({
            body: { userId, role: role as any },
            headers: await headers(),
        });
        await logActivity({
            event: 'role.changed',
            actor: { id: session.id, email: session.email },
            target: { id: target.id, email: target.email },
            meta: { from: target.role, to: role },
        });
        updateTag('users');
        return { success: true };
    } catch (err: any) {
        console.error('updateUserRole error:', err);
        const message = err?.body?.message ?? err?.message ?? 'Failed to update role';
        return { success: false, error: message };
    }
}

// ─── Ban / Unban user ─────────────────────────────────────────────────────────

export async function banUser(
    userId: string,
    reason?: string
): Promise<{ success: true } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.BAN_USERS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (session.id === userId) {
        return { success: false, error: 'You cannot ban yourself' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };
    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You cannot ban a higher-ranked user' };
    }

    try {
        const banReason = reason ?? 'Banned by administrator';
        await auth.api.banUser({
            body: { userId, banReason },
            headers: await headers(),
        });
        await logActivity({
            event: 'user.banned',
            actor: { id: session.id, email: session.email },
            target: { id: target.id, email: target.email },
            meta: { reason: banReason },
        });
        updateTag('users');
        return { success: true };
    } catch (err: any) {
        console.error('banUser error:', err);
        return { success: false, error: 'Failed to ban user' };
    }
}

export async function unbanUser(
    userId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.BAN_USERS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };
    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You cannot unban a higher-ranked user' };
    }

    try {
        await auth.api.unbanUser({
            body: { userId },
            headers: await headers(),
        });
        await logActivity({
            event: 'user.unbanned',
            actor: { id: session.id, email: session.email },
            target: { id: target.id, email: target.email },
        });
        updateTag('users');
        return { success: true };
    } catch (err: any) {
        console.error('unbanUser error:', err);
        return { success: false, error: 'Failed to unban user' };
    }
}

// ─── Delete user ──────────────────────────────────────────────────────────────

export async function deleteUser(
    userId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.DELETE_USERS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (session.id === userId) {
        return { success: false, error: 'You cannot delete your own account' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };

    // SUPER_ADMIN can never be deleted
    if (target.role === Role.SUPER_ADMIN) {
        return { success: false, error: 'The super admin account cannot be deleted' };
    }

    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You can only delete users with a lower role than yours' };
    }

    try {
        await auth.api.removeUser({
            body: { userId },
            headers: await headers(),
        });
        // The row is gone, so the FK is null and the email is what identifies them.
        await logActivity({
            event: 'user.deleted',
            actor: { id: session.id, email: session.email },
            target: { id: null, email: target.email },
            meta: { role: target.role },
        });
        updateTag('users');
        return { success: true };
    } catch (err: any) {
        console.error('deleteUser error:', err);
        const message = err?.body?.message ?? err?.message ?? 'Failed to delete user';
        return { success: false, error: message };
    }
}

// ─── Get single user ──────────────────────────────────────────────────────────

export async function getUserById(
    userId: string
): Promise<{ success: true; user: ManagedUser } | { success: false; error: string }> {
    const authorised = await requirePermission(Permission.VIEW_USERS);
    if (!authorised) return UNAUTHORIZED;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                banned: true,
                banReason: true,
                banExpires: true,
                emailVerified: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) return { success: false, error: 'User not found' };

        return {
            success: true,
            user: { ...user, banned: user.banned ?? false } as unknown as ManagedUser,
        };
    } catch (err: any) {
        console.error('getUserById error:', err);
        return { success: false, error: 'Failed to fetch user' };
    }
}

// ─── Permission overrides ─────────────────────────────────────────────────────
//
// A grant adds one permission on top of the target's role; a revoke removes one from
// it. Both are one row in user_permission per (user, permission), updated in place, so
// the newest decision is the one that stands. Rules, in the order they are checked
// (ADR 0002 section 7; checklist 4a.20 to 4a.23):
//
//   - the caller holds MANAGE_PERMISSIONS, which only SUPER_ADMIN has by default;
//   - the permission is a real one;
//   - nobody edits their own permissions;
//   - nothing is overridden on a SUPER_ADMIN, in either direction;
//   - the caller outranks the target, as for every other change to a user;
//   - every change writes an activity_log row naming actor, target, permission and
//     direction.
//
// wattup-proforma reads ACCESS_PROFORMA through the proforma_member view, so a grant
// or revoke of it changes who may sign in there on the very next request.

type OverrideResult = { success: true } | { success: false; error: string };

async function setPermissionOverride(
    userId: string,
    permission: Permission,
    granted: boolean
): Promise<OverrideResult> {
    const authorised = await requirePermission(Permission.MANAGE_PERMISSIONS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (!isPermission(permission)) {
        return { success: false, error: 'Unknown permission' };
    }
    if (session.id === userId) {
        return { success: false, error: 'You cannot change your own permissions' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === Role.SUPER_ADMIN) {
        return { success: false, error: 'A super admin holds every permission; overrides do not apply' };
    }
    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You cannot change the permissions of a higher-ranked user' };
    }

    try {
        await prisma.userPermission.upsert({
            where: { userId_permission: { userId: target.id, permission } },
            update: { granted, grantedById: session.id },
            create: { userId: target.id, permission, granted, grantedById: session.id },
        });
        await logActivity({
            event: granted ? 'permission.granted' : 'permission.revoked',
            actor: { id: session.id, email: session.email },
            target: { id: target.id, email: target.email },
            meta: { permission },
        });
        return { success: true };
    } catch (err: any) {
        console.error(granted ? 'grantPermission error:' : 'revokePermission error:', err);
        return { success: false, error: 'Failed to update permissions' };
    }
}

/** Adds `permission` to the user on top of their role. */
export async function grantPermission(userId: string, permission: Permission): Promise<OverrideResult> {
    return setPermissionOverride(userId, permission, true);
}

/** Removes `permission` from the user, whatever their role says. Never applies to SUPER_ADMIN. */
export async function revokePermission(userId: string, permission: Permission): Promise<OverrideResult> {
    return setPermissionOverride(userId, permission, false);
}

/**
 * Deletes the override, so the permission goes back to whatever the role says.
 *
 * Without this an override is a one-way door: once granted or revoked, a permission
 * would follow the row for ever and stop tracking the role, which is the opposite of
 * what a default is for. The same guards as setting one, because putting a user back
 * on their role's defaults is as much a permission change as taking them off it, and
 * the audit row says which direction it went.
 */
export async function clearPermissionOverride(
    userId: string,
    permission: Permission
): Promise<OverrideResult> {
    const authorised = await requirePermission(Permission.MANAGE_PERMISSIONS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    if (!isPermission(permission)) {
        return { success: false, error: 'Unknown permission' };
    }
    if (session.id === userId) {
        return { success: false, error: 'You cannot change your own permissions' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: USER_TARGET_SELECT });
    if (!target) return { success: false, error: 'User not found' };
    if (!canManageRole(session.role, target.role)) {
        return { success: false, error: 'You cannot change the permissions of a higher-ranked user' };
    }

    try {
        // deleteMany, so clearing an override that is not there is a no-op rather than
        // a "record not found": the UI may send it for a permission already on default.
        const { count } = await prisma.userPermission.deleteMany({
            where: { userId: target.id, permission },
        });
        // Only an actual removal is an event. Writing a row for a no-op would fill the
        // audit log with changes that did not happen.
        if (count > 0) {
            await logActivity({
                event: 'permission.reset',
                actor: { id: session.id, email: session.email },
                target: { id: target.id, email: target.email },
                meta: { permission },
            });
        }
        return { success: true };
    } catch (err: any) {
        console.error('clearPermissionOverride error:', err);
        return { success: false, error: 'Failed to update permissions' };
    }
}

// ─── Invite email ─────────────────────────────────────────────────────────────

async function sendInviteEmail(params: {
    name: string;
    email: string;
    password: string;
    role: Role;
    invitedBy: string;
}) {
    const roleLabel = ROLE_LABELS[params.role] ?? params.role;
    const { subject, html } = inviteUserTemplate({
        name: params.name,
        email: params.email,
        password: params.password,
        role: roleLabel,
        invitedBy: params.invitedBy,
    });
    await sendMail({ email: params.email, subject, html });
}
