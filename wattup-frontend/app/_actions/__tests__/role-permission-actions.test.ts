import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Permission, Role } from '@/lib/permissions';

/**
 * The guards on the one writer for role_permission (checklist 4c.13 to 4c.15).
 *
 * This table is what every request resolves permissions from, so a careless edit is the
 * fastest way to lock the product out of its own administration. Each guard below is a
 * lockout this refuses, and each assertion is on the values the stub received, never on
 * whether it was called.
 */

const { prisma, requirePermission, logActivity, updateTag } = vi.hoisted(() => ({
    prisma: {
        rolePermission: {
            findMany: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
    requirePermission: vi.fn(),
    logActivity: vi.fn(),
    updateTag: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/activity-log', () => ({ logActivity }));
vi.mock('next/cache', () => ({ updateTag }));
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: { api: {} } }));
vi.mock('@/lib/permission-guard', async () => {
    const actual = await vi.importActual<typeof import('@/lib/permission-guard')>('@/lib/permission-guard');
    return { ...actual, requirePermission: (p: Permission) => requirePermission(p) };
});

const SUPER = {
    session: { id: 'su1', email: 'super@wattupusa.com', role: Role.SUPER_ADMIN },
    permissions: new Set([Permission.MANAGE_PERMISSIONS]),
};

let actions: typeof import('@/app/_actions/role-permission-actions');

beforeEach(async () => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue(SUPER);
    prisma.rolePermission.findMany.mockResolvedValue([
        { role: Role.SUPER_ADMIN },
        { role: Role.ADMIN },
    ]);
    actions ??= await import('@/app/_actions/role-permission-actions');
});

const wrote = () =>
    prisma.rolePermission.upsert.mock.calls.length + prisma.rolePermission.deleteMany.mock.calls.length;

describe('setRolePermission, the happy paths', () => {
    it('turning a cell on upserts exactly that role and permission', async () => {
        const result = await actions.setRolePermission(Role.EDITOR, Permission.VIEW_ACTIVITY_LOG, true);

        expect(result).toEqual({ success: true });
        expect(prisma.rolePermission.upsert).toHaveBeenCalledWith({
            where: { role_permission: { role: Role.EDITOR, permission: Permission.VIEW_ACTIVITY_LOG } },
            update: {},
            create: { role: Role.EDITOR, permission: Permission.VIEW_ACTIVITY_LOG },
        });
        expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled();
    });

    it('turning a cell off deletes exactly that pair', async () => {
        const result = await actions.setRolePermission(Role.SALES, Permission.VIEW_LOCATIONS, false);

        expect(result).toEqual({ success: true });
        expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
            where: { role: Role.SALES, permission: Permission.VIEW_LOCATIONS },
        });
    });

    it('writes one audit row naming the role, the permission and the direction', async () => {
        await actions.setRolePermission(Role.EDITOR, Permission.ACCESS_PROFORMA, true);

        expect(logActivity).toHaveBeenCalledTimes(1);
        expect(logActivity).toHaveBeenCalledWith({
            event: 'role_permission.changed',
            actor: { id: 'su1', email: 'super@wattupusa.com' },
            target: { id: null, email: 'super@wattupusa.com' },
            meta: { role: Role.EDITOR, permission: Permission.ACCESS_PROFORMA, granted: true },
        });
    });

    it('invalidates the readers whose contents depend on the change', async () => {
        await actions.setRolePermission(Role.EDITOR, Permission.ACCESS_PROFORMA, true);
        expect(updateTag.mock.calls.flat()).toContain('users');
    });
});

describe('setRolePermission, the refusals', () => {
    it('refuses a caller without MANAGE_PERMISSIONS, and asks for exactly that permission', async () => {
        requirePermission.mockResolvedValue(null);

        const result = await actions.setRolePermission(Role.EDITOR, Permission.CREATE_POST, true);

        expect(requirePermission).toHaveBeenCalledWith(Permission.MANAGE_PERMISSIONS);
        expect(result).toMatchObject({ success: false });
        expect(wrote()).toBe(0);
    });

    it('refuses an unknown role', async () => {
        const result = await actions.setRolePermission('WIZARD' as Role, Permission.CREATE_POST, true);

        expect(result).toEqual({ success: false, error: 'Unknown role' });
        expect(wrote()).toBe(0);
    });

    it.each([
        [Permission.EDIT_OWN_POST, 'retired by client answer I'],
        [Permission.DELETE_OWN_POST, 'retired by client answer I'],
        [Permission.DELETE_ANY_MEDIA, 'reserved drift value'],
        [Permission.MANAGE_PROFILE, 'reserved drift value'],
        ['NOT_A_PERMISSION' as Permission, 'not in the enum at all'],
    ])('refuses %s (%s), so no row is written that nothing will read', async (permission) => {
        const result = await actions.setRolePermission(Role.EDITOR, permission, true);

        expect(result).toEqual({ success: false, error: 'That permission is not editable' });
        expect(wrote()).toBe(0);
    });

    it('locks the SUPER_ADMIN row, in both directions (4c.14)', async () => {
        for (const enabled of [true, false]) {
            const result = await actions.setRolePermission(Role.SUPER_ADMIN, Permission.CREATE_POST, enabled);
            expect(result).toMatchObject({ success: false });
        }
        expect(wrote()).toBe(0);
    });

    it('refuses to remove the permission the caller is using to make the change', async () => {
        requirePermission.mockResolvedValue({
            ...SUPER,
            session: { id: 'a1', email: 'admin@wattupusa.com', role: Role.ADMIN },
        });

        const result = await actions.setRolePermission(Role.ADMIN, Permission.MANAGE_PERMISSIONS, false);

        expect(result).toEqual({
            success: false,
            error: 'You cannot remove the permission you are using to make this change.',
        });
        expect(wrote()).toBe(0);
    });

    it('refuses to leave no role holding permission management, counting from the database', async () => {
        // Only ADMIN holds it, and ADMIN is the role being stripped.
        prisma.rolePermission.findMany.mockResolvedValue([{ role: Role.ADMIN }]);

        const result = await actions.setRolePermission(Role.ADMIN, Permission.MANAGE_PERMISSIONS, false);

        expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
            where: { permission: Permission.MANAGE_PERMISSIONS },
            select: { role: true },
        });
        expect(result).toEqual({
            success: false,
            error: 'At least one role must keep permission management.',
        });
        expect(wrote()).toBe(0);
    });

    it('allows removing it from one role while another still holds it', async () => {
        prisma.rolePermission.findMany.mockResolvedValue([
            { role: Role.SUPER_ADMIN },
            { role: Role.ADMIN },
        ]);

        const result = await actions.setRolePermission(Role.ADMIN, Permission.MANAGE_PERMISSIONS, false);

        expect(result).toEqual({ success: true });
        expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
            where: { role: Role.ADMIN, permission: Permission.MANAGE_PERMISSIONS },
        });
    });

    it('writes no audit row when the database write fails', async () => {
        prisma.rolePermission.upsert.mockRejectedValue(new Error('connection lost'));

        const result = await actions.setRolePermission(Role.EDITOR, Permission.CREATE_POST, true);

        expect(result).toEqual({ success: false, error: 'Failed to update the role' });
        expect(logActivity).not.toHaveBeenCalled();
    });
});
