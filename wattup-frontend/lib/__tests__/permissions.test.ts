import { describe, expect, it } from 'vitest';
import {
    ALL_PERMISSIONS,
    ALL_ROLES,
    ASSIGNABLE_ROLES,
    canManageRole,
    hasPermission,
    INERT_PERMISSIONS,
    isInertPermission,
    isPermission,
    isRole,
    NO_PERMISSIONS,
    Permission,
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
    Role,
    ROLE_BADGE_CLASSES,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    ROLE_RANK,
} from '@/lib/permissions';

describe('roles', () => {
    it('are exactly the five from ADR 0002', () => {
        expect(Object.values(Role).sort()).toEqual(
            ['ADMIN', 'EDITOR', 'NETWORK_MANAGER', 'SALES', 'SUPER_ADMIN'].sort()
        );
        expect(ALL_ROLES).toHaveLength(5);
    });

    it('carry the ranks ADR 0002 section 4 assigns', () => {
        expect(ROLE_RANK).toEqual({
            SUPER_ADMIN: 100,
            ADMIN: 80,
            NETWORK_MANAGER: 60,
            EDITOR: 50,
            SALES: 40,
        });
    });

    it('every role has a label, a badge, a rank and a default set', () => {
        for (const role of ALL_ROLES) {
            expect(ROLE_LABELS[role]).toBeTruthy();
            expect(ROLE_BADGE_CLASSES[role]).toBeTruthy();
            expect(ROLE_RANK[role]).toBeGreaterThan(0);
            expect(ROLE_PERMISSIONS[role]).toBeDefined();
        }
    });

    it('SUPER_ADMIN is not assignable from a form; the other four are, highest first', () => {
        expect(ASSIGNABLE_ROLES).toEqual(['ADMIN', 'NETWORK_MANAGER', 'EDITOR', 'SALES']);
        expect(ASSIGNABLE_ROLES).not.toContain(Role.SUPER_ADMIN);
    });
});

describe('canManageRole', () => {
    // The full table, not a sample: rank(actor) > rank(target), strictly.
    const table: [actor: Role, target: Role, expected: boolean][] = [
        ['SUPER_ADMIN', 'SUPER_ADMIN', false],
        ['SUPER_ADMIN', 'ADMIN', true],
        ['SUPER_ADMIN', 'NETWORK_MANAGER', true],
        ['SUPER_ADMIN', 'EDITOR', true],
        ['SUPER_ADMIN', 'SALES', true],
        ['ADMIN', 'SUPER_ADMIN', false],
        ['ADMIN', 'ADMIN', false],
        ['ADMIN', 'NETWORK_MANAGER', true],
        ['ADMIN', 'EDITOR', true],
        ['ADMIN', 'SALES', true],
        ['NETWORK_MANAGER', 'SUPER_ADMIN', false],
        ['NETWORK_MANAGER', 'ADMIN', false],
        ['NETWORK_MANAGER', 'NETWORK_MANAGER', false],
        ['NETWORK_MANAGER', 'EDITOR', true],
        ['NETWORK_MANAGER', 'SALES', true],
        ['EDITOR', 'SUPER_ADMIN', false],
        ['EDITOR', 'ADMIN', false],
        ['EDITOR', 'NETWORK_MANAGER', false],
        ['EDITOR', 'EDITOR', false],
        ['EDITOR', 'SALES', true],
        ['SALES', 'SUPER_ADMIN', false],
        ['SALES', 'ADMIN', false],
        ['SALES', 'NETWORK_MANAGER', false],
        ['SALES', 'EDITOR', false],
        ['SALES', 'SALES', false],
    ];

    it.each(table)('%s over %s is %s', (actor, target, expected) => {
        expect(canManageRole(actor, target)).toBe(expected);
    });

    it('a role the enum does not contain neither manages nor is managed', () => {
        expect(canManageRole('INTERN', Role.SALES)).toBe(false);
        expect(canManageRole(Role.SUPER_ADMIN, 'INTERN')).toBe(false);
        expect(canManageRole('', Role.SALES)).toBe(false);
        expect(canManageRole(Role.ADMIN, '')).toBe(false);
    });
});

describe('hasPermission', () => {
    it('reads the resolved set and nothing else', () => {
        const set = new Set<Permission>([Permission.VIEW_LOCATIONS]);
        expect(hasPermission(set, Permission.VIEW_LOCATIONS)).toBe(true);
        expect(hasPermission(set, Permission.MANAGE_LOCATIONS)).toBe(false);
    });

    it('no session means no permission', () => {
        expect(hasPermission(null, Permission.VIEW_LOCATIONS)).toBe(false);
        expect(hasPermission(undefined, Permission.VIEW_LOCATIONS)).toBe(false);
        expect(hasPermission(NO_PERMISSIONS, Permission.VIEW_LOCATIONS)).toBe(false);
    });
});

describe('type guards', () => {
    it('isRole and isPermission accept only enum values', () => {
        expect(isRole('SALES')).toBe(true);
        expect(isRole('INTERN')).toBe(false);
        expect(isRole('UNASSIGNED')).toBe(false);
        expect(isRole(undefined)).toBe(false);
        expect(isRole('toString')).toBe(false);
        expect(isPermission('ACCESS_PROFORMA')).toBe(true);
        expect(isPermission('access_proforma')).toBe(false);
        expect(isPermission(42)).toBe(false);
    });
});

describe('ROLE_PERMISSIONS', () => {
    it('SUPER_ADMIN holds every permission, including the reserved ones', () => {
        expect([...ROLE_PERMISSIONS.SUPER_ADMIN].sort()).toEqual([...ALL_PERMISSIONS].sort());
    });

    it('MANAGE_PERMISSIONS is SUPER_ADMIN only (checklist 4a.22)', () => {
        for (const role of ALL_ROLES) {
            expect(ROLE_PERMISSIONS[role].includes(Permission.MANAGE_PERMISSIONS)).toBe(
                role === Role.SUPER_ADMIN
            );
        }
    });

    it('SALES holds no write permission', () => {
        expect([...ROLE_PERMISSIONS.SALES].sort()).toEqual(
            [Permission.VIEW_LOCATIONS, Permission.ACCESS_PROFORMA].sort()
        );
    });

    it('EDITOR has no pro-forma access by default; NETWORK_MANAGER and SALES do', () => {
        expect(ROLE_PERMISSIONS.EDITOR).not.toContain(Permission.ACCESS_PROFORMA);
        expect(ROLE_PERMISSIONS.NETWORK_MANAGER).toContain(Permission.ACCESS_PROFORMA);
        expect(ROLE_PERMISSIONS.SALES).toContain(Permission.ACCESS_PROFORMA);
    });

    it('lists only real permissions and no duplicates', () => {
        for (const role of ALL_ROLES) {
            const list = ROLE_PERMISSIONS[role];
            expect(new Set(list).size).toBe(list.length);
            for (const permission of list) expect(isPermission(permission)).toBe(true);
        }
    });
});

describe('PERMISSION_GROUPS', () => {
    const grouped = PERMISSION_GROUPS.flatMap(group => group.permissions);

    it('holds every permission exactly once, so a screen that renders the groups renders them all', () => {
        expect([...grouped].sort()).toEqual([...ALL_PERMISSIONS].sort());
        expect(new Set(grouped).size).toBe(ALL_PERMISSIONS.length);
    });

    it('follows the order lib/permissions.ts declares Permission in', () => {
        expect(PERMISSION_GROUPS.map(group => group.key)).toEqual([
            'content',
            'network',
            'users',
            'site',
            'media',
            'audit',
            'proforma',
            'reserved',
        ]);
    });

    it('every group has a unique key and a label', () => {
        const keys = PERMISSION_GROUPS.map(group => group.key);
        expect(new Set(keys).size).toBe(keys.length);
        for (const group of PERMISSION_GROUPS) {
            expect(group.label).toBeTruthy();
            expect(group.permissions.length).toBeGreaterThan(0);
        }
    });
});

describe('PERMISSION_LABELS', () => {
    it('names every permission, with no two sharing a name', () => {
        const labels = ALL_PERMISSIONS.map(permission => PERMISSION_LABELS[permission]);
        for (const label of labels) expect(label).toBeTruthy();
        expect(new Set(labels).size).toBe(ALL_PERMISSIONS.length);
    });
});

describe('INERT_PERMISSIONS', () => {
    it('is the two retired own-post values and the four reserved ones, and nothing else', () => {
        expect([...INERT_PERMISSIONS].sort()).toEqual(
            [
                Permission.EDIT_OWN_POST,
                Permission.DELETE_OWN_POST,
                Permission.DELETE_ANY_MEDIA,
                Permission.DELETE_OWN_MEDIA,
                Permission.MANAGE_PROFILE,
                Permission.VIEW_ANALYTICS,
            ].sort()
        );
    });

    it('isInertPermission answers for every value of the enum', () => {
        expect(isInertPermission(Permission.EDIT_OWN_POST)).toBe(true);
        expect(isInertPermission(Permission.VIEW_ANALYTICS)).toBe(true);
        expect(isInertPermission(Permission.MANAGE_LOCATIONS)).toBe(false);
        expect(isInertPermission(Permission.ACCESS_PROFORMA)).toBe(false);
        for (const permission of ALL_PERMISSIONS) {
            expect(isInertPermission(permission)).toBe(INERT_PERMISSIONS.includes(permission));
        }
    });

    it('no role holds an inert permission by default, apart from SUPER_ADMIN which holds all of them', () => {
        for (const role of ALL_ROLES) {
            if (role === Role.SUPER_ADMIN) continue;
            for (const permission of INERT_PERMISSIONS) {
                // EDIT_OWN_POST and DELETE_OWN_POST are still in the in-code map for
                // ADMIN and EDITOR, retired but not yet removed from it. That is the
                // one exception, and it is spelled out rather than left implicit.
                const retiredOwnPost =
                    permission === Permission.EDIT_OWN_POST ||
                    permission === Permission.DELETE_OWN_POST;
                if (retiredOwnPost) continue;
                expect(ROLE_PERMISSIONS[role]).not.toContain(permission);
            }
        }
    });
});
