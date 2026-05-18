/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth';
import { sendMail } from '@/lib/email';
import { inviteUserTemplate } from '@/lib/mail/invite-user';
import { canManageRole, hasPermission, Permission, Role, ROLE_LABELS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { getSession } from './auth-actions';

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

// ─── Permission guard ─────────────────────────────────────────────────────────

async function requirePermission(permission: Permission) {
    const session = await getSession();
    if (!session) return { session: null, error: 'Unauthorized' as const };
    if (!hasPermission(session.role, permission))
        return { session: null, error: 'Insufficient permissions' as const };
    return { session, error: null };
}

// ─── List users ───────────────────────────────────────────────────────────────

export async function listUsers(options?: {
    search?: string;
    role?: Role;
    page?: number;
    pageSize?: number;
}): Promise<{ success: true; users: ManagedUser[]; total: number } | { success: false; error: string }> {
    const { session, error } = await requirePermission(Permission.VIEW_USERS);
    if (!session) return { success: false, error };

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

// ─── Cached-safe data fetch (no auth — caller must verify before use) ─────────

export async function fetchUsersData(pageSize = 50): Promise<{ users: ManagedUser[]; total: number }> {
    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: pageSize,
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
        prisma.user.count(),
    ]);

    return {
        users: rows.map(u => ({
            ...u,
            banned: u.banned ?? false,
        })) as unknown as ManagedUser[],
        total,
    };
}

// ─── Create (invite) user ─────────────────────────────────────────────────────

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    sendInviteEmail?: boolean;
}): Promise<{ success: true; userId: string; emailError?: string } | { success: false; error: string }> {
    const { session, error } = await requirePermission(Permission.INVITE_USERS);
    if (!session) return { success: false, error };

    if (!data.email || !data.password || !data.name) {
        return { success: false, error: 'Name, email, and password are required' };
    }
    if (data.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
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
    const { session, error } = await requirePermission(Permission.CHANGE_USER_ROLE);
    if (!session) return { success: false, error };

    if (session.id === userId) {
        return { success: false, error: 'You cannot change your own role' };
    }

    // Fetch target user to check hierarchy
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) return { success: false, error: 'User not found' };

    // Only SUPER_ADMIN can manage ADMIN/SUPER_ADMIN roles
    if (!canManageRole(session.role, target.role as string)) {
        return { success: false, error: 'You cannot change the role of a higher-ranked user' };
    }
    // Cannot assign a role equal to or above the actor's own rank
    if (!canManageRole(session.role, role)) {
        return { success: false, error: 'You cannot assign a role equal to or above your own' };
    }

    try {
        await auth.api.setRole({
            body: { userId, role: role as any },
            headers: await headers(),
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
    const { session, error } = await requirePermission(Permission.BAN_USERS);
    if (!session) return { success: false, error };

    if (session.id === userId) {
        return { success: false, error: 'You cannot ban yourself' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target && !canManageRole(session.role, target.role as string)) {
        return { success: false, error: 'You cannot ban a higher-ranked user' };
    }

    try {
        await auth.api.banUser({
            body: { userId, banReason: reason ?? 'Banned by administrator' },
            headers: await headers(),
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
    const { session, error } = await requirePermission(Permission.BAN_USERS);
    if (!session) return { success: false, error };

    try {
        await auth.api.unbanUser({
            body: { userId },
            headers: await headers(),
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
    const { session, error } = await requirePermission(Permission.DELETE_USERS);
    if (!session) return { success: false, error };

    if (session.id === userId) {
        return { success: false, error: 'You cannot delete your own account' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) return { success: false, error: 'User not found' };

    // SUPER_ADMIN can never be deleted
    if ((target.role as string) === Role.SUPER_ADMIN) {
        return { success: false, error: 'The super admin account cannot be deleted' };
    }

    // Only SUPER_ADMIN can delete ADMIN users
    if (!canManageRole(session.role, target.role as string)) {
        return { success: false, error: 'You can only delete users with a lower role than yours' };
    }

    try {
        await auth.api.removeUser({
            body: { userId },
            headers: await headers(),
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
    const { session, error } = await requirePermission(Permission.VIEW_USERS);
    if (!session) return { success: false, error };

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
