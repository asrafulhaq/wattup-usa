import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PERMISSIONS, Permission, Role, ROLE_PERMISSIONS } from '@/lib/permissions';

// The module imports the Prisma singleton for getEffectivePermissions; the tests below
// go through resolvePermissions with a stub, so the singleton is never constructed.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import { resolvePermissions, type PermissionSource } from '@/lib/permissions-server';

type UserRow = { role: string; banned: boolean | null; banExpires: Date | null } | null;
type RoleRow = { permission: string };
type OverrideRow = { permission: string; granted: boolean };

/** A stub client whose three calls are spies, so the test can assert what was asked. */
function stubDb(input: {
    user: UserRow;
    roleRows?: RoleRow[] | Error;
    overrideRows?: OverrideRow[] | Error;
}) {
    const answer = <T,>(value: T | Error) =>
        value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
    const db = {
        user: { findUnique: vi.fn(async () => input.user) },
        rolePermission: { findMany: vi.fn(() => answer(input.roleRows ?? [])) },
        userPermission: { findMany: vi.fn(() => answer(input.overrideRows ?? [])) },
    };
    return db as unknown as PermissionSource & typeof db;
}

const editor: UserRow = { role: Role.EDITOR, banned: false, banExpires: null };
const editorDefaults = ROLE_PERMISSIONS.EDITOR.map(permission => ({ permission }));

describe('resolvePermissions', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('asks for the user by id, then the role rows for THAT role and the overrides for THAT user', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        await resolvePermissions(db, 'user-1');

        expect(db.user.findUnique).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            select: { role: true, banned: true, banExpires: true },
        });
        expect(db.rolePermission.findMany).toHaveBeenCalledWith({
            where: { role: Role.EDITOR },
            select: { permission: true },
        });
        expect(db.userPermission.findMany).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            select: { permission: true, granted: true },
        });
    });

    it('role defaults alone: the set is exactly the role rows', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        const set = await resolvePermissions(db, 'user-1');
        expect([...set].sort()).toEqual([...ROLE_PERMISSIONS.EDITOR].sort());
    });

    it('a revoke removes a role default', async () => {
        const db = stubDb({
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.PUBLISH_POST, granted: false }],
        });
        const set = await resolvePermissions(db, 'user-1');
        expect(set.has(Permission.PUBLISH_POST)).toBe(false);
        expect(set.has(Permission.CREATE_POST)).toBe(true);
        expect(set.size).toBe(ROLE_PERMISSIONS.EDITOR.length - 1);
    });

    it('a grant adds a permission the role lacks', async () => {
        const db = stubDb({
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.ACCESS_PROFORMA, granted: true }],
        });
        const set = await resolvePermissions(db, 'user-1');
        expect(set.has(Permission.ACCESS_PROFORMA)).toBe(true);
        expect(set.size).toBe(ROLE_PERMISSIONS.EDITOR.length + 1);
    });

    it('a revoke is ignored for SUPER_ADMIN (checklist 4a.21); a grant is harmless', async () => {
        const db = stubDb({
            user: { role: Role.SUPER_ADMIN, banned: false, banExpires: null },
            roleRows: ROLE_PERMISSIONS.SUPER_ADMIN.map(permission => ({ permission })),
            overrideRows: [
                { permission: Permission.MANAGE_PERMISSIONS, granted: false },
                { permission: Permission.ACCESS_PROFORMA, granted: false },
                { permission: Permission.VIEW_USERS, granted: true },
            ],
        });
        const set = await resolvePermissions(db, 'root');
        expect(set.has(Permission.MANAGE_PERMISSIONS)).toBe(true);
        expect(set.has(Permission.ACCESS_PROFORMA)).toBe(true);
        expect(set.size).toBe(ROLE_PERMISSIONS.SUPER_ADMIN.length);
    });

    it('an unknown user resolves to the empty set without querying the tables', async () => {
        const db = stubDb({ user: null });
        const set = await resolvePermissions(db, 'nobody');
        expect(set).toBe(NO_PERMISSIONS);
        expect(set.size).toBe(0);
        expect(db.rolePermission.findMany).not.toHaveBeenCalled();
        expect(db.userPermission.findMany).not.toHaveBeenCalled();
    });

    it('a banned user resolves to the empty set, whatever the role', async () => {
        const db = stubDb({
            user: { role: Role.SUPER_ADMIN, banned: true, banExpires: null },
            roleRows: ROLE_PERMISSIONS.SUPER_ADMIN.map(permission => ({ permission })),
        });
        expect((await resolvePermissions(db, 'root')).size).toBe(0);
        expect(db.rolePermission.findMany).not.toHaveBeenCalled();
    });

    it('an expired ban is no ban', async () => {
        const db = stubDb({
            user: { role: Role.EDITOR, banned: true, banExpires: new Date(Date.now() - 1000) },
            roleRows: editorDefaults,
        });
        expect((await resolvePermissions(db, 'user-1')).size).toBe(ROLE_PERMISSIONS.EDITOR.length);
    });

    it('a role with no rows in an existing table holds nothing (no silent fallback)', async () => {
        const db = stubDb({ user: editor, roleRows: [] });
        expect((await resolvePermissions(db, 'user-1')).size).toBe(0);
    });

    it('falls back to the in-code map only when the table does not exist, and says so once', async () => {
        const missing = Object.assign(new Error('relation "role_permission" does not exist'), {
            code: 'P2021',
        });
        const db = stubDb({ user: editor, roleRows: missing });
        const set = await resolvePermissions(db, 'user-1');
        expect([...set].sort()).toEqual([...ROLE_PERMISSIONS.EDITOR].sort());
        expect(console.error).toHaveBeenCalledTimes(1);

        // Second resolution: same answer, no second report.
        await resolvePermissions(stubDb({ user: editor, roleRows: missing }), 'user-1');
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('any other database error propagates', async () => {
        const boom = Object.assign(new Error('connection refused'), { code: 'P1001' });
        const db = stubDb({ user: editor, roleRows: boom });
        await expect(resolvePermissions(db, 'user-1')).rejects.toBe(boom);
    });
});
