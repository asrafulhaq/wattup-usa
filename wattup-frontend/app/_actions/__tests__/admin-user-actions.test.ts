import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Permission, Role } from '@/lib/permissions';

/**
 * The guard rules on the user actions (checklist 4a.20 to 4a.23, 4a.30, 4a.32),
 * against a stubbed database, a stubbed Better Auth and a stubbed request. Every
 * assertion on a stub is on the VALUES it received, not on whether it was called.
 */

// vi.mock factories are hoisted above every import, so the stubs they close over are
// hoisted with them.
const { prisma, authApi, requirePermission } = vi.hoisted(() => ({
    prisma: {
        user: { findUnique: vi.fn() },
        userPermission: { upsert: vi.fn(), deleteMany: vi.fn() },
        activityLog: { create: vi.fn() },
    },
    authApi: {
        createUser: vi.fn(),
        setRole: vi.fn(),
        banUser: vi.fn(),
        unbanUser: vi.fn(),
        removeUser: vi.fn(),
    },
    requirePermission: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ auth: { api: authApi } }));
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }));
vi.mock('@/lib/mail/invite-user', () => ({ inviteUserTemplate: () => ({ subject: '', html: '' }) }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('next/headers', () => ({
    headers: async () => new Headers({ 'x-forwarded-for': '198.51.100.9', 'user-agent': 'Vitest' }),
}));
vi.mock('@/lib/permission-guard', async () => {
    const actual = await vi.importActual<typeof import('@/lib/permission-guard')>('@/lib/permission-guard');
    return { ...actual, requirePermission: (p: Permission) => requirePermission(p) };
});

import {
    banUser,
    clearPermissionOverride,
    createUser,
    deleteUser,
    grantPermission,
    revokePermission,
    updateUserRole,
} from '@/app/_actions/admin-user-actions';

type SessionStub = { id: string; email: string; role: string; name: string; image: null };
const root: SessionStub = { id: 'root', email: 'root@example.com', role: Role.SUPER_ADMIN, name: 'Root', image: null };
const admin: SessionStub = { id: 'adm', email: 'admin@example.com', role: Role.ADMIN, name: 'Adm', image: null };

/** The guard answers "allowed" for `session` holding `held`, "refused" otherwise. */
function guardAllows(session: SessionStub | null, held: Permission[]) {
    requirePermission.mockImplementation(async (permission: Permission) => {
        if (!session || !held.includes(permission)) return null;
        return { session, permissions: new Set(held) };
    });
}

const editorRow = { id: 'u-editor', email: 'editor@example.com', role: Role.EDITOR };
const superRow = { id: 'u-super', email: 'super@example.com', role: Role.SUPER_ADMIN };
const adminRow = { id: 'u-admin', email: 'admin2@example.com', role: Role.ADMIN };

beforeEach(() => {
    for (const fn of [...Object.values(prisma.user), ...Object.values(prisma.userPermission), ...Object.values(prisma.activityLog), ...Object.values(authApi)]) {
        fn.mockReset();
    }
    requirePermission.mockReset();
    prisma.userPermission.upsert.mockResolvedValue({});
    prisma.userPermission.deleteMany.mockResolvedValue({ count: 1 });
    prisma.activityLog.create.mockResolvedValue({});
});

describe('clearPermissionOverride', () => {
    it('deletes the override for that one user and permission, and nothing else', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);

        const result = await clearPermissionOverride('u-editor', Permission.ACCESS_PROFORMA);

        expect(result).toEqual({ success: true });
        expect(prisma.userPermission.deleteMany).toHaveBeenCalledWith({
            where: { userId: 'u-editor', permission: Permission.ACCESS_PROFORMA },
        });
    });

    it('writes an audit row naming the actor, the target and the permission', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);

        await clearPermissionOverride('u-editor', Permission.ACCESS_PROFORMA);

        expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'permission.reset',
            actorEmail: root.email,
            email: editorRow.email,
            meta: { permission: Permission.ACCESS_PROFORMA },
        });
    });

    it('writes no audit row when there was no override to remove', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);
        prisma.userPermission.deleteMany.mockResolvedValue({ count: 0 });

        const result = await clearPermissionOverride('u-editor', Permission.ACCESS_PROFORMA);

        // A no-op is still a success; it is just not an event, and filling the audit
        // log with changes that did not happen would make it useless.
        expect(result).toEqual({ success: true });
        expect(prisma.activityLog.create).not.toHaveBeenCalled();
    });

    it('refuses a caller without MANAGE_PERMISSIONS, before touching the database', async () => {
        guardAllows(admin, [Permission.VIEW_USERS, Permission.EDIT_USERS]);

        const result = await clearPermissionOverride('u-editor', Permission.ACCESS_PROFORMA);

        expect(result).toMatchObject({ success: false });
        expect(prisma.userPermission.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses a permission outside the enum', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);

        const result = await clearPermissionOverride('u-editor', 'BECOME_ROOT' as Permission);

        expect(result).toEqual({ success: false, error: 'Unknown permission' });
        expect(prisma.userPermission.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses the caller changing their own permissions', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);

        const result = await clearPermissionOverride(root.id, Permission.ACCESS_PROFORMA);

        expect(result).toEqual({ success: false, error: 'You cannot change your own permissions' });
        expect(prisma.userPermission.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses a target the caller does not outrank', async () => {
        guardAllows(admin, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(superRow);

        const result = await clearPermissionOverride('u-super', Permission.ACCESS_PROFORMA);

        expect(result).toMatchObject({ success: false });
        expect(prisma.userPermission.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses an id that does not exist', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(null);

        const result = await clearPermissionOverride('nobody', Permission.ACCESS_PROFORMA);

        expect(result).toEqual({ success: false, error: 'User not found' });
        expect(prisma.userPermission.deleteMany).not.toHaveBeenCalled();
    });
});

describe('grantPermission / revokePermission', () => {
    it('refuses a caller without MANAGE_PERMISSIONS, before touching the database', async () => {
        guardAllows(admin, [Permission.VIEW_USERS, Permission.EDIT_USERS]);

        const result = await grantPermission('u-editor', Permission.ACCESS_PROFORMA);

        expect(result).toEqual({ success: false, error: 'You do not have permission to do that.' });
        expect(requirePermission).toHaveBeenCalledWith(Permission.MANAGE_PERMISSIONS);
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.userPermission.upsert).not.toHaveBeenCalled();
    });

    it('refuses an unknown permission name', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        const result = await grantPermission('u-editor', 'BECOME_ROOT' as Permission);
        expect(result).toEqual({ success: false, error: 'Unknown permission' });
        expect(prisma.userPermission.upsert).not.toHaveBeenCalled();
    });

    it('refuses editing your own permissions (4a.20)', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        const result = await revokePermission('root', Permission.MANAGE_PERMISSIONS);
        expect(result).toEqual({ success: false, error: 'You cannot change your own permissions' });
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('refuses any override on a SUPER_ADMIN target (4a.21), grant or revoke', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(superRow);

        for (const call of [
            () => revokePermission('u-super', Permission.ACCESS_PROFORMA),
            () => grantPermission('u-super', Permission.ACCESS_PROFORMA),
        ]) {
            const result = await call();
            expect(result.success).toBe(false);
            expect((result as { error: string }).error).toMatch(/super admin/i);
        }
        expect(prisma.userPermission.upsert).not.toHaveBeenCalled();
        expect(prisma.activityLog.create).not.toHaveBeenCalled();
    });

    it('refuses a target the caller does not outrank', async () => {
        // An ADMIN who was granted MANAGE_PERMISSIONS individually still cannot touch a peer.
        guardAllows(admin, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(adminRow);

        const result = await grantPermission('u-admin', Permission.DELETE_USERS);
        expect(result).toEqual({
            success: false,
            error: 'You cannot change the permissions of a higher-ranked user',
        });
        expect(prisma.userPermission.upsert).not.toHaveBeenCalled();
    });

    it('happy path: upserts the override and writes the exact activity_log row (4a.23)', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);

        const result = await grantPermission('u-editor', Permission.ACCESS_PROFORMA);

        expect(result).toEqual({ success: true });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 'u-editor' },
            select: { id: true, email: true, role: true },
        });
        expect(prisma.userPermission.upsert).toHaveBeenCalledWith({
            where: { userId_permission: { userId: 'u-editor', permission: Permission.ACCESS_PROFORMA } },
            update: { granted: true, grantedById: 'root' },
            create: {
                userId: 'u-editor',
                permission: Permission.ACCESS_PROFORMA,
                granted: true,
                grantedById: 'root',
            },
        });
        expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
        expect(prisma.activityLog.create).toHaveBeenCalledWith({
            data: {
                app: 'dashboard',
                event: 'permission.granted',
                email: 'editor@example.com',
                userId: 'u-editor',
                actorUserId: 'root',
                actorEmail: 'root@example.com',
                ipAddress: '198.51.100.9',
                userAgent: 'Vitest',
                correlationId: null,
                meta: { permission: Permission.ACCESS_PROFORMA },
            },
        });
    });

    it('a revoke writes granted = false and the revoked event', async () => {
        guardAllows(root, [Permission.MANAGE_PERMISSIONS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);

        await revokePermission('u-editor', Permission.PUBLISH_POST);

        expect(prisma.userPermission.upsert.mock.calls[0][0].update).toEqual({
            granted: false,
            grantedById: 'root',
        });
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'permission.revoked',
            meta: { permission: Permission.PUBLISH_POST },
        });
    });
});

describe('createUser', () => {
    const body = { name: 'New', email: 'new@example.com', password: 'a-strong-password' };

    it('refuses a missing role, before touching Better Auth (4a.30, 4a.32)', async () => {
        guardAllows(root, [Permission.INVITE_USERS]);

        const result = await createUser({ ...body, role: undefined as unknown as Role });

        expect(result).toEqual({ success: false, error: 'Choose a role for the new user' });
        expect(authApi.createUser).not.toHaveBeenCalled();
    });

    it('refuses a role that is not assignable, SUPER_ADMIN and names outside the enum included', async () => {
        guardAllows(root, [Permission.INVITE_USERS]);

        for (const role of [Role.SUPER_ADMIN, 'INTERN', 'UNASSIGNED', '']) {
            const result = await createUser({ ...body, role: role as Role });
            expect(result).toEqual({ success: false, error: 'Choose a role for the new user' });
        }
        expect(authApi.createUser).not.toHaveBeenCalled();
    });

    it('refuses a role the caller does not outrank', async () => {
        guardAllows(admin, [Permission.INVITE_USERS]);
        const result = await createUser({ ...body, role: Role.ADMIN });
        expect(result).toEqual({
            success: false,
            error: 'You cannot assign a role equal to or above your own',
        });
        expect(authApi.createUser).not.toHaveBeenCalled();
    });

    it('creates with the explicit role and logs user.created', async () => {
        guardAllows(root, [Permission.INVITE_USERS]);
        prisma.user.findUnique.mockResolvedValue(null);
        authApi.createUser.mockResolvedValue({ user: { id: 'u-new' } });

        const result = await createUser({ ...body, role: Role.SALES });

        expect(result).toEqual({ success: true, userId: 'u-new', emailError: undefined });
        expect(authApi.createUser.mock.calls[0][0].body).toEqual({
            name: 'New',
            email: 'new@example.com',
            password: 'a-strong-password',
            role: Role.SALES,
            data: { emailVerified: true },
        });
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'user.created',
            email: 'new@example.com',
            userId: 'u-new',
            actorUserId: 'root',
            meta: { role: Role.SALES },
        });
    });
});

describe('updateUserRole', () => {
    it('ranks both the current and the new role against the actor, then logs from/to', async () => {
        guardAllows(admin, [Permission.CHANGE_USER_ROLE]);
        prisma.user.findUnique.mockResolvedValue(editorRow);
        authApi.setRole.mockResolvedValue({});

        expect(await updateUserRole('u-editor', Role.ADMIN)).toEqual({
            success: false,
            error: 'You cannot assign a role equal to or above your own',
        });
        expect(authApi.setRole).not.toHaveBeenCalled();

        expect(await updateUserRole('u-editor', Role.SALES)).toEqual({ success: true });
        expect(authApi.setRole.mock.calls[0][0].body).toEqual({ userId: 'u-editor', role: Role.SALES });
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'role.changed',
            email: 'editor@example.com',
            userId: 'u-editor',
            actorUserId: 'adm',
            meta: { from: Role.EDITOR, to: Role.SALES },
        });
    });
});

describe('banUser / deleteUser', () => {
    it('ban logs user.banned with the reason', async () => {
        guardAllows(root, [Permission.BAN_USERS]);
        prisma.user.findUnique.mockResolvedValue(editorRow);
        authApi.banUser.mockResolvedValue({});

        expect(await banUser('u-editor', 'spam')).toEqual({ success: true });
        expect(authApi.banUser.mock.calls[0][0].body).toEqual({ userId: 'u-editor', banReason: 'spam' });
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'user.banned',
            userId: 'u-editor',
            meta: { reason: 'spam' },
        });
    });

    it('delete never touches a SUPER_ADMIN and logs the deleted email with a null id', async () => {
        guardAllows(root, [Permission.DELETE_USERS]);
        prisma.user.findUnique.mockResolvedValue(superRow);
        expect((await deleteUser('u-super')).success).toBe(false);
        expect(authApi.removeUser).not.toHaveBeenCalled();

        prisma.user.findUnique.mockResolvedValue(editorRow);
        authApi.removeUser.mockResolvedValue({});
        expect(await deleteUser('u-editor')).toEqual({ success: true });
        expect(prisma.activityLog.create.mock.calls[0][0].data).toMatchObject({
            event: 'user.deleted',
            email: 'editor@example.com',
            userId: null,
            meta: { role: Role.EDITOR },
        });
    });
});
