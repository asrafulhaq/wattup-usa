import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * lib/dashboard/overview.ts asks Postgres two questions instead of twelve, using
 * count(*) FILTER, which Prisma has no expression for. So it names its tables and
 * columns in a raw string, and a raw string is the kind of query that keeps compiling,
 * keeps type checking, and fails at runtime the first time somebody renames a table.
 *
 * This reads prisma/schema.prisma and checks the two statements against it. It is not a
 * substitute for running them, which was done against the live database when they were
 * written: 12 statements and 2 265 ms became 2 statements and 274 ms, with every one of
 * the thirteen numbers identical. It is the guard for the change that comes later.
 */

const ROOT = process.cwd();
const OVERVIEW = readFileSync(path.join(ROOT, 'lib', 'dashboard', 'overview.ts'), 'utf8');
const SCHEMA = readFileSync(path.join(ROOT, 'prisma', 'schema.prisma'), 'utf8');

/** The two $queryRaw template bodies, so the prose above them is not searched. */
const TEMPLATES = [...OVERVIEW.matchAll(/\$queryRaw<[^>]*>`([\s\S]*?)`/g)].map(m => m[1]);
const SQL = TEMPLATES.join('\n');

/** The table a model actually has, honouring @@map. */
function tableFor(model: string): string {
    const block = SCHEMA.match(new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, 'm'));
    expect(block, `model ${model} is gone from the schema`).not.toBeNull();
    const mapped = block![1].match(/@@map\("([^"]+)"\)/);
    return mapped ? mapped[1] : model;
}

/** Whether a model declares a field, so a rename cannot pass silently. */
function hasField(model: string, field: string): boolean {
    const block = SCHEMA.match(new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, 'm'));
    return new RegExp(`^\\s+${field}\\s`, 'm').test(block?.[1] ?? '');
}

describe('the overview aggregate names things that exist', () => {
    it('reads the two statements at all, so a rewrite cannot make this vacuous', () => {
        expect(TEMPLATES.length).toBe(2);
        expect(SQL).toContain('count(*) FILTER');
    });

    it.each([
        ['Location', 'FROM location'],
        ['Amenity', 'FROM amenity'],
        ['LocationAmenity', 'FROM location_amenity'],
        ['Posts', 'FROM "Posts"'],
    ])('%s is still mapped to the table the SQL reads', (model, clause) => {
        const table = tableFor(model);
        const quoted = /^[a-z_]+$/.test(table) ? table : `"${table}"`;
        expect(
            clause,
            `${model} maps to ${table}; overview.ts reads ${clause}`
        ).toContain(quoted);
        expect(OVERVIEW, `overview.ts no longer reads ${model}`).toContain(clause);
    });

    it.each([
        ['Location', 'published'],
        ['Location', 'status'],
        ['Location', 'pricePerKwh'],
        ['Location', 'chargerCount'],
        ['Amenity', 'active'],
        ['Posts', 'status'],
    ])('%s.%s still exists and is still named in the SQL', (model, field) => {
        expect(hasField(model, field), `${model}.${field} is gone from the schema`).toBe(true);
        // Camel case columns must stay quoted or Postgres folds them to lower case.
        const needle = /[A-Z]/.test(field) ? `"${field}"` : field;
        expect(SQL, `overview.ts no longer reads ${field}`).toContain(needle);
    });

    it('every StationStatus the SQL counts is still a member of the enum', () => {
        const block = SCHEMA.match(/^enum StationStatus \{([\s\S]*?)^\}/m);
        const members = (block?.[1].match(/[A-Z_]+/g) ?? []).filter(Boolean);
        for (const status of ['LIVE', 'PLANNED', 'UNDER_CONSTRUCTION']) {
            expect(members, `${status} is no longer a StationStatus`).toContain(status);
            expect(SQL).toContain(`status = '${status}'`);
        }
    });

    it('every count is cast, so a bigint never reaches the browser as an unserialisable value', () => {
        // node-postgres returns count(*) as a string and Prisma as a BigInt; either one
        // breaks JSON serialisation of the RSC payload. ::int makes it a JS number.
        const selects = SQL.match(/count\(\*\)[^\n]*/g) ?? [];
        expect(selects.length).toBeGreaterThanOrEqual(9);
        for (const line of selects) {
            expect(line, `uncast count: ${line.trim()}`).toContain('::int');
        }
    });

    it('takes no interpolation, so the raw strings carry no injection surface', () => {
        expect(TEMPLATES.length).toBe(2);
        for (const t of TEMPLATES) {
            expect(t, 'a ${} in a raw SQL template').not.toMatch(/\$\{/);
        }
    });
});
