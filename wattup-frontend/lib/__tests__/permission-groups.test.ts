import { describe, expect, it } from 'vitest';
import {
    ALL_PERMISSIONS,
    EDITABLE_PERMISSIONS,
    isEditablePermission,
    PERMISSION_GROUPS,
    Permission,
    permissionLabel,
    ROLE_PERMISSIONS,
    Role,
    UNCHECKED_PERMISSIONS,
} from '@/lib/permissions';

/**
 * Checklist 4c.13: the Roles page offers exactly the permissions the code reads.
 *
 * The six it must not offer are the two retired by ADR 0002 section 10 (client answer I)
 * and the four reserved drift values. They are named once, in UNCHECKED_PERMISSIONS, and
 * everything else here is derived from that one list, so the page and the server action
 * behind it cannot end up disagreeing about which cells exist.
 */

const RETIRED = [Permission.EDIT_OWN_POST, Permission.DELETE_OWN_POST];
const RESERVED = [
    Permission.DELETE_ANY_MEDIA,
    Permission.DELETE_OWN_MEDIA,
    Permission.MANAGE_PROFILE,
    Permission.VIEW_ANALYTICS,
];

describe('UNCHECKED_PERMISSIONS', () => {
    it('is exactly the two retired and the four reserved values, and nothing else', () => {
        expect([...UNCHECKED_PERMISSIONS].sort()).toEqual([...RETIRED, ...RESERVED].sort());
    });

    it('every one of them is still a member of the enum, since the database type keeps them', () => {
        for (const permission of UNCHECKED_PERMISSIONS) {
            expect(ALL_PERMISSIONS).toContain(permission);
        }
    });

    it('SUPER_ADMIN still holds all six by default: its row is genuinely every permission', () => {
        for (const permission of UNCHECKED_PERMISSIONS) {
            expect(ROLE_PERMISSIONS[Role.SUPER_ADMIN]).toContain(permission);
        }
    });
});

describe('EDITABLE_PERMISSIONS', () => {
    it('is the enum minus the unchecked six', () => {
        expect(EDITABLE_PERMISSIONS.length).toBe(ALL_PERMISSIONS.length - 6);
        expect(EDITABLE_PERMISSIONS.length).toBe(21);
        expect(
            [...EDITABLE_PERMISSIONS, ...UNCHECKED_PERMISSIONS].sort()
        ).toEqual([...ALL_PERMISSIONS].sort());
    });

    it('offers none of the unchecked six', () => {
        for (const permission of UNCHECKED_PERMISSIONS) {
            expect(EDITABLE_PERMISSIONS).not.toContain(permission);
        }
    });

    it('keeps MANAGE_PERMISSIONS, which the page must be able to move between roles', () => {
        expect(EDITABLE_PERMISSIONS).toContain(Permission.MANAGE_PERMISSIONS);
    });
});

describe('isEditablePermission', () => {
    it('accepts an editable permission', () => {
        expect(isEditablePermission(Permission.ACCESS_PROFORMA)).toBe(true);
        expect(isEditablePermission(Permission.MANAGE_PERMISSIONS)).toBe(true);
    });

    it('refuses a retired one', () => {
        expect(isEditablePermission(Permission.EDIT_OWN_POST)).toBe(false);
        expect(isEditablePermission(Permission.DELETE_OWN_POST)).toBe(false);
    });

    it('refuses a reserved one', () => {
        expect(isEditablePermission(Permission.VIEW_ANALYTICS)).toBe(false);
        expect(isEditablePermission(Permission.MANAGE_PROFILE)).toBe(false);
    });

    it('refuses anything the enum does not contain', () => {
        expect(isEditablePermission('MANAGE_EVERYTHING')).toBe(false);
        expect(isEditablePermission('manage_permissions')).toBe(false);
        expect(isEditablePermission(null)).toBe(false);
        expect(isEditablePermission(undefined)).toBe(false);
        expect(isEditablePermission(42)).toBe(false);
        expect(isEditablePermission({ toString: () => 'VIEW_USERS' })).toBe(false);
    });
});

describe('PERMISSION_GROUPS', () => {
    const flattened = PERMISSION_GROUPS.flatMap(group => [...group.permissions]);

    it('flattened, it is EDITABLE_PERMISSIONS exactly, in the same order', () => {
        // A permission added to the enum and not given a group fails here rather than
        // quietly never appearing on the page.
        expect(flattened).toEqual([...EDITABLE_PERMISSIONS]);
    });

    it('puts no permission in two groups', () => {
        expect(new Set(flattened).size).toBe(flattened.length);
    });

    it('gives every group a label and a sentence saying what it covers', () => {
        for (const group of PERMISSION_GROUPS) {
            expect(group.label.length).toBeGreaterThan(2);
            expect(group.description.length).toBeGreaterThan(20);
            expect(group.permissions.length).toBeGreaterThan(0);
        }
    });

    it('keeps the seven groups the enum is already commented into', () => {
        expect(PERMISSION_GROUPS.map(group => group.label)).toEqual([
            'Content',
            'Charging network',
            'User management',
            'Site management',
            'Media',
            'Audit',
            'Pro-forma builder',
        ]);
    });
});

describe('permissionLabel', () => {
    it('reads the enum name as a sentence', () => {
        expect(permissionLabel(Permission.EDIT_ANY_POST)).toBe('Edit any post');
        expect(permissionLabel(Permission.MANAGE_PERMISSIONS)).toBe('Manage permissions');
        expect(permissionLabel(Permission.ACCESS_PROFORMA)).toBe('Access proforma');
    });

    it('produces a non-empty label for every permission the page draws', () => {
        for (const permission of EDITABLE_PERMISSIONS) {
            expect(permissionLabel(permission)).toMatch(/^[A-Z][a-z]/);
        }
    });
});
