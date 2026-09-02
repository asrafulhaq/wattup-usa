import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ALL_PERMISSIONS,
    NO_PERMISSIONS,
    Permission,
    Role,
    ROLE_PERMISSIONS,
} from '@/lib/permissions';

// The module imports the Prisma singleton for getEffectivePermissions; the tests below
// go through resolvePermissions with a stub, so the singleton is never constructed.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import {
    describePermissions,
    resolvePermissions,
    type PermissionDescription,
    type PermissionSource,
} from '@/lib/permissions-server';

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

// ─── Provenance (checklist 4c.5) ──────────────────────────────────────────────

describe('describePermissions', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    /** The one row for `permission`, so a test names the permission it means. */
    const rowFor = (rows: PermissionDescription[], permission: Permission) =>
        rows.find(row => row.permission === permission);

    it('describes every permission in the enum exactly once, in ALL_PERMISSIONS order', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        const rows = await describePermissions(db, 'user-1');

        expect(rows.map(row => row.permission)).toEqual([...ALL_PERMISSIONS]);
        expect(rows).toHaveLength(ALL_PERMISSIONS.length);
    });

    it('asks for the role rows of THAT role and the overrides of THAT user', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        await describePermissions(db, 'user-1');

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

    it('from the role: fromRole true, no override, effective', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.PUBLISH_POST)).toEqual({
            permission: Permission.PUBLISH_POST,
            fromRole: true,
            override: null,
            effective: true,
        });
    });

    it('not held at all: every field says so', async () => {
        const db = stubDb({ user: editor, roleRows: editorDefaults });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.MANAGE_PERMISSIONS)).toEqual({
            permission: Permission.MANAGE_PERMISSIONS,
            fromRole: false,
            override: null,
            effective: false,
        });
    });

    it('granted on top: fromRole false, override granted, effective', async () => {
        const db = stubDb({
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.ACCESS_PROFORMA, granted: true }],
        });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.ACCESS_PROFORMA)).toEqual({
            permission: Permission.ACCESS_PROFORMA,
            fromRole: false,
            override: 'granted',
            effective: true,
        });
    });

    it('revoked from the role: fromRole STAYS true, override revoked, not effective', async () => {
        // The distinction the resolved set cannot make: the role default is still
        // there, which is what the screen has to show underneath the override.
        const db = stubDb({
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.PUBLISH_POST, granted: false }],
        });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.PUBLISH_POST)).toEqual({
            permission: Permission.PUBLISH_POST,
            fromRole: true,
            override: 'revoked',
            effective: false,
        });
    });

    it('a grant of something the role already holds is reported as a grant and stays effective', async () => {
        const db = stubDb({
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.CREATE_POST, granted: true }],
        });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.CREATE_POST)).toEqual({
            permission: Permission.CREATE_POST,
            fromRole: true,
            override: 'granted',
            effective: true,
        });
    });

    it('SUPER_ADMIN: a revoke is recorded but ignored, so effective stays true (4a.21)', async () => {
        const db = stubDb({
            user: { role: Role.SUPER_ADMIN, banned: false, banExpires: null },
            roleRows: ROLE_PERMISSIONS.SUPER_ADMIN.map(permission => ({ permission })),
            overrideRows: [{ permission: Permission.MANAGE_PERMISSIONS, granted: false }],
        });
        const rows = await describePermissions(db, 'root');

        expect(rowFor(rows, Permission.MANAGE_PERMISSIONS)).toEqual({
            permission: Permission.MANAGE_PERMISSIONS,
            fromRole: true,
            override: 'revoked',
            effective: true,
        });
        expect(rows.every(row => row.effective)).toBe(true);
    });

    it('a banned user: the provenance still shows, nothing is effective', async () => {
        const db = stubDb({
            user: { role: Role.EDITOR, banned: true, banExpires: null },
            roleRows: editorDefaults,
            overrideRows: [{ permission: Permission.ACCESS_PROFORMA, granted: true }],
        });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.PUBLISH_POST)?.fromRole).toBe(true);
        expect(rowFor(rows, Permission.ACCESS_PROFORMA)?.override).toBe('granted');
        expect(rows.some(row => row.effective)).toBe(false);
    });

    it('an unknown user describes nothing, and neither table is read', async () => {
        const db = stubDb({ user: null });
        expect(await describePermissions(db, 'nobody')).toEqual([]);
        expect(db.rolePermission.findMany).not.toHaveBeenCalled();
        expect(db.userPermission.findMany).not.toHaveBeenCalled();
    });

    it('agrees with resolvePermissions on the effective set, override for override', async () => {
        const input = {
            user: editor,
            roleRows: editorDefaults,
            overrideRows: [
                { permission: Permission.PUBLISH_POST, granted: false },
                { permission: Permission.ACCESS_PROFORMA, granted: true },
                { permission: Permission.VIEW_ACTIVITY_LOG, granted: true },
            ],
        };
        const described = await describePermissions(stubDb(input), 'user-1');
        const resolved = await resolvePermissions(stubDb(input), 'user-1');

        expect(described.filter(row => row.effective).map(row => row.permission).sort()).toEqual(
            [...resolved].sort()
        );
    });

    it('falls back to the in-code map when the tables do not exist, with no overrides to report', async () => {
        const missing = Object.assign(new Error('relation "role_permission" does not exist'), {
            code: 'P2021',
        });
        const db = stubDb({ user: editor, roleRows: missing });
        const rows = await describePermissions(db, 'user-1');

        expect(rowFor(rows, Permission.CREATE_POST)).toEqual({
            permission: Permission.CREATE_POST,
            fromRole: true,
            override: null,
            effective: true,
        });
        expect(rows.every(row => row.override === null)).toBe(true);
    });
});
