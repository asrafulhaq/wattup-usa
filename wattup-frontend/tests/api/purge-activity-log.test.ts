import { Prisma } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * app/api/cron/purge-activity-log/route.ts. ADR 0001 section 9, checklist 4b.8.
 *
 * Four properties: the route is closed to anything but the exact bearer (401,
 * empty body, and no statement issued), the right bearer runs one
 * parameterised DELETE carrying the retention as its only parameter, a
 * missing table is a 200 `skipped` reported once per process, and a
 * malformed retention deletes nothing.
 *
 * '@/lib/prisma' is replaced wholesale; the fake exposes only $executeRaw, so
 * anything else the route might call is a TypeError, and no client or driver
 * adapter is ever constructed. The route module is re-imported per test so
 * its "reported once" flag starts clean each time.
 */

const { executeRaw } = vi.hoisted(() => ({
    executeRaw: vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>>(),
}));

vi.mock('@/lib/prisma', () => ({ default: { $executeRaw: executeRaw } }));
vi.mock('@prisma/adapter-pg', () => ({
    PrismaPg: class {
        constructor() {
            throw new Error('[tests] a Prisma driver adapter must never be constructed in a test');
        }
    },
}));

const SECRET = 'test-cron-secret-not-real-0123456789';
const ROUTE_URL = 'https://wattupusa.test/api/cron/purge-activity-log';

async function loadRoute() {
    vi.resetModules();
    return await import('@/app/api/cron/purge-activity-log/route');
}

function call(GET: (request: Request) => Promise<Response>, authorization?: string) {
    const headers = new Headers();
    if (authorization !== undefined) headers.set('authorization', authorization);
    return GET(new Request(ROUTE_URL, { method: 'GET', headers }));
}

/** The SQL the fake received, with each parameter slot marked `$n`, the way Prisma renders it. */
function issuedSql(): { sql: string; values: unknown[] } {
    expect(executeRaw).toHaveBeenCalledTimes(1);
    const [strings, ...values] = executeRaw.mock.calls[0]!;
    const sql = strings.reduce((out, part, i) => out + (i === 0 ? '' : `$${i}`) + part, '');
    return { sql, values };
}

/** What $executeRaw raises against this database while the table has not been migrated. */
function missingTableError(code: 'P2010' | 'P2021'): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('relation "activity_log" does not exist', {
        code,
        clientVersion: 'test',
        meta: code === 'P2010' ? { driverAdapterError: { cause: { kind: 'TableDoesNotExist', originalCode: '42P01' } } } : {},
    });
}

beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    delete process.env.ACTIVITY_LOG_RETENTION_DAYS;
    executeRaw.mockReset().mockResolvedValue(0);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.ACTIVITY_LOG_RETENTION_DAYS;
});

describe('authorisation', () => {
    it('answers 401 with an empty body and issues no statement when the header is missing', async () => {
        const { GET } = await loadRoute();
        const response = await call(GET);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('');
        expect(executeRaw).not.toHaveBeenCalled();
    });

    it.each([
        ['a wrong secret', `Bearer ${SECRET}x`],
        ['a prefix of the secret', `Bearer ${SECRET.slice(0, -1)}`],
        ['the secret without the Bearer scheme', SECRET],
        ['a lower-case scheme', `bearer ${SECRET}`],
        ['an empty header', ''],
    ])('answers 401 with an empty body and issues no statement for %s', async (_label, header) => {
        const { GET } = await loadRoute();
        const response = await call(GET, header);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('');
        expect(executeRaw).not.toHaveBeenCalled();
    });

    it('answers 401 to the right bearer while CRON_SECRET is unset: nothing is authorised by default', async () => {
        delete process.env.CRON_SECRET;
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(response.status).toBe(401);
        expect(await response.text()).toBe('');
        expect(executeRaw).not.toHaveBeenCalled();
    });
});

describe('the purge', () => {
    it('runs one parameterised DELETE on activity_log by createdAt with the default 90 days as its only parameter', async () => {
        executeRaw.mockResolvedValue(3);
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toStrictEqual({ deleted: 3, retentionDays: 90 });

        const { sql, values } = issuedSql();
        expect(sql).toBe('DELETE FROM "activity_log" WHERE "createdAt" < now() - make_interval(days => $1::int)');
        expect(values).toStrictEqual([90]);
    });

    it('takes the retention from ACTIVITY_LOG_RETENTION_DAYS and reports it', async () => {
        process.env.ACTIVITY_LOG_RETENTION_DAYS = '30';
        executeRaw.mockResolvedValue(0);
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(await response.json()).toStrictEqual({ deleted: 0, retentionDays: 30 });
        expect(issuedSql().values).toStrictEqual([30]);
    });

    it('treats a blank ACTIVITY_LOG_RETENTION_DAYS as unset', async () => {
        process.env.ACTIVITY_LOG_RETENTION_DAYS = '  ';
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(await response.json()).toStrictEqual({ deleted: 0, retentionDays: 90 });
        expect(issuedSql().values).toStrictEqual([90]);
    });

    it.each([['0'], ['-1'], ['1.5'], ['ninety'], ['90 days']])(
        'answers 500 and deletes nothing when ACTIVITY_LOG_RETENTION_DAYS is %j',
        async (raw) => {
            process.env.ACTIVITY_LOG_RETENTION_DAYS = raw;
            const { GET } = await loadRoute();
            const response = await call(GET, `Bearer ${SECRET}`);

            expect(response.status).toBe(500);
            expect(await response.json()).toStrictEqual({ error: 'ACTIVITY_LOG_RETENTION_DAYS is not a whole number of days' });
            expect(executeRaw).not.toHaveBeenCalled();
        },
    );
});

describe('the table is not there yet', () => {
    it.each([['P2010'], ['P2021']] as const)('answers 200 skipped on %s and warns once across two runs', async (code) => {
        executeRaw.mockRejectedValue(missingTableError(code));
        const { GET } = await loadRoute();

        const first = await call(GET, `Bearer ${SECRET}`);
        expect(first.status).toBe(200);
        expect(await first.json()).toStrictEqual({ deleted: 0, skipped: 'table missing' });

        const second = await call(GET, `Bearer ${SECRET}`);
        expect(second.status).toBe(200);
        expect(await second.json()).toStrictEqual({ deleted: 0, skipped: 'table missing' });

        expect(executeRaw).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn).mock.calls[0]![0]).toContain('activity_log does not exist yet');
        expect(console.error).not.toHaveBeenCalled();
    });

    it('does not mistake another Prisma error for a missing table: 500, logged, no skipped', async () => {
        executeRaw.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('permission denied for table activity_log', {
                code: 'P2010',
                clientVersion: 'test',
                meta: { driverAdapterError: { cause: { kind: 'postgres', originalCode: '42501' } } },
            }),
        );
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: 'purge failed' });
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('answers 500 for a plain Error too, never a throw out of the handler', async () => {
        executeRaw.mockRejectedValue(new Error('connection refused'));
        const { GET } = await loadRoute();
        const response = await call(GET, `Bearer ${SECRET}`);

        expect(response.status).toBe(500);
        expect(await response.json()).toStrictEqual({ error: 'purge failed' });
    });
});
