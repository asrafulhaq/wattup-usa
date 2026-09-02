import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS, ALL_ROLES, Role, ROLE_PERMISSIONS } from '@/lib/permissions';
import { ROLE_PERMISSIONS_BEFORE_4A } from './fixtures/role-permissions-before-4a';

/**
 * Checklist 4a.4 and 4a.5: the migration's seed of role_permission is parsed from the
 * SQL as written, not retyped, and held to two things:
 *
 *   1. no surviving role lost a permission it held before phase 4a (behaviour
 *      preserving; the "before" is a verbatim copy of the map on main), and
 *   2. it is the same matrix lib/permissions.ts carries in code, row for row, so the
 *      fallback map and Better Auth's derived access control cannot drift from what
 *      the database was seeded with.
 */

const MIGRATION = path.resolve(
    __dirname,
    '../../prisma/migrations/20260903100000_rbac_permissions/migration.sql'
);

/** Every (role, permission) pair in the INSERT INTO "role_permission" VALUES list. */
function seededRolePermissions(): Record<string, Set<string>> {
    const sql = readFileSync(MIGRATION, 'utf8');
    const start = sql.indexOf('INSERT INTO "role_permission"');
    const end = sql.indexOf('ON CONFLICT', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = sql.slice(start, end);

    const rows = block.matchAll(/\(gen_random_uuid\(\)::text,\s*'([A-Z_]+)',\s*'([A-Z_]+)'\)/g);
    const result: Record<string, Set<string>> = {};
    for (const [, role, permission] of rows) {
        (result[role] ??= new Set()).add(permission);
    }
    return result;
}

describe('role_permission seed (migration 20260903100000_rbac_permissions)', () => {
    const seeded = seededRolePermissions();

    it('seeds all five roles and nothing else', () => {
        expect(Object.keys(seeded).sort()).toEqual([...ALL_ROLES].sort());
    });

    it.each(Object.keys(ROLE_PERMISSIONS_BEFORE_4A) as (keyof typeof ROLE_PERMISSIONS_BEFORE_4A)[])(
        '%s keeps every permission it held before 4a',
        role => {
            const before = ROLE_PERMISSIONS_BEFORE_4A[role];
            const after = seeded[role];
            const lost = before.filter(permission => !after.has(permission));
            expect(lost).toEqual([]);
        }
    );

    it('SUPER_ADMIN is seeded with every value of the enum, the reserved four included', () => {
        expect([...seeded.SUPER_ADMIN].sort()).toEqual([...ALL_PERMISSIONS].sort());
    });

    it.each(ALL_ROLES)('%s: the seed and ROLE_PERMISSIONS in code are the same set', role => {
        expect([...seeded[role]].sort()).toEqual([...ROLE_PERMISSIONS[role]].sort());
    });

    it('seeds only names the Permission enum contains', () => {
        for (const set of Object.values(seeded)) {
            for (const permission of set) {
                expect(ALL_PERMISSIONS as readonly string[]).toContain(permission);
            }
        }
    });

    it('the gains beyond the pre-4a map are the new permissions ADR 0002 assigns', () => {
        const gains = (role: keyof typeof ROLE_PERMISSIONS_BEFORE_4A) =>
            [...seeded[role]].filter(p => !ROLE_PERMISSIONS_BEFORE_4A[role].includes(p)).sort();

        expect(gains(Role.SUPER_ADMIN)).toEqual(
            [
                'VIEW_LOCATIONS',
                'MANAGE_PERMISSIONS',
                'UPLOAD_MEDIA',
                'DELETE_MEDIA',
                'VIEW_ACTIVITY_LOG',
                'ACCESS_PROFORMA',
                'DELETE_ANY_MEDIA',
                'DELETE_OWN_MEDIA',
                'MANAGE_PROFILE',
                'VIEW_ANALYTICS',
            ].sort()
        );
        expect(gains(Role.ADMIN)).toEqual(
            [
                'VIEW_LOCATIONS',
                'UPLOAD_MEDIA',
                'DELETE_MEDIA',
                'VIEW_ACTIVITY_LOG',
                'ACCESS_PROFORMA',
            ].sort()
        );
        expect(gains(Role.EDITOR)).toEqual(
            ['VIEW_LOCATIONS', 'UPLOAD_MEDIA', 'DELETE_MEDIA'].sort()
        );
    });
});
