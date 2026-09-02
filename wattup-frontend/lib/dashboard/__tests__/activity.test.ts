import { beforeEach, describe, expect, it, vi } from 'vitest';

const requirePermission = vi.fn();

// The module imports the Prisma singleton for getUserActivity; every test below goes
// through readActivity with a stub, so the singleton is never constructed.
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('@/lib/permission-guard', () => ({
    requirePermission: (permission: string) => requirePermission(permission),
    UNAUTHORIZED: { success: false, error: 'You do not have permission to do that.' },
}));

import {
    ACTIVITY_PAGE_SIZE,
    activityWhere,
    getUserActivity,
    offsetFor,
    readActivity,
    signInWhere,
    SIGNIN_EVENTS,
    whereForScope,
    type ActivitySource,
} from '@/lib/dashboard/activity';
import { Permission } from '@/lib/permissions';

/**
 * The activity_log reads behind the user detail page (checklist 4c.6, 4c.7).
 *
 * The property under test is the `where` clause, by value: a filter that quietly widened
 * to every row in the table, or narrowed to only the rows where this user was the
 * subject, would still return a plausible looking table. So each test asserts the whole
 * argument object the client is handed, not that it was handed one.
 */

const USER = 'usr_7';

function stubDb(input: { rows?: unknown[]; total?: number }) {
    const db = {
        activityLog: {
            findMany: vi.fn(async () => input.rows ?? []),
            count: vi.fn(async () => input.total ?? 0),
        },
    };
    return db as unknown as ActivitySource & typeof db;
}

const row = (over: Record<string, unknown> = {}) => ({
    id: 'log_1',
    app: 'proforma',
    event: 'signin.success',
    email: 'sales@wattupusa.com',
    userId: USER,
    actorUserId: null,
    actorEmail: null,
    ipAddress: '203.0.113.7',
    userAgent: 'Mozilla/5.0',
    meta: null,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    ...over,
});

describe('activityWhere', () => {
    it('matches the user as SUBJECT or as ACTOR, and on nothing else', () => {
        expect(activityWhere(USER)).toEqual({
            OR: [{ userId: USER }, { actorUserId: USER }],
        });
    });

    it('does not match on the email, which outlives the account it names', () => {
        expect(JSON.stringify(activityWhere(USER))).not.toContain('email');
    });
});

describe('signInWhere', () => {
    it('is the same OR, narrowed to the four sign-in and code events', () => {
        expect(signInWhere(USER)).toEqual({
            OR: [{ userId: USER }, { actorUserId: USER }],
            event: {
                in: ['signin.success', 'signin.failed', 'code.requested', 'code.refused'],
            },
        });
    });

    it('keeps the OR: an event filter alone would return the whole table', () => {
        expect(signInWhere(USER).OR).toEqual([{ userId: USER }, { actorUserId: USER }]);
    });

    it('SIGNIN_EVENTS is exactly the four events the two apps write', () => {
        expect([...SIGNIN_EVENTS]).toEqual([
            'signin.success',
            'signin.failed',
            'code.requested',
            'code.refused',
        ]);
    });
});

describe('whereForScope', () => {
    it('all is the unfiltered OR; signin is the narrowed one', () => {
        expect(whereForScope(USER, 'all')).toEqual(activityWhere(USER));
        expect(whereForScope(USER, 'signin')).toEqual(signInWhere(USER));
    });
});

describe('offsetFor', () => {
    it('page 1 starts at 0 and each page moves by pageSize', () => {
        expect(offsetFor(1, 20)).toBe(0);
        expect(offsetFor(2, 20)).toBe(20);
        expect(offsetFor(5, 20)).toBe(80);
    });

    it('a page below 1, a fraction or a nonsense number never yields a negative skip', () => {
        expect(offsetFor(0, 20)).toBe(0);
        expect(offsetFor(-4, 20)).toBe(0);
        expect(offsetFor(2.9, 20)).toBe(20);
        expect(offsetFor(Number.NaN, 20)).toBe(0);
        expect(offsetFor(Number.POSITIVE_INFINITY, 20)).toBe(0);
    });
});

describe('readActivity', () => {
    it('passes the OR filter, newest first, twenty a page, and counts the SAME where', async () => {
        const db = stubDb({ rows: [row()], total: 43 });
        const page = await readActivity(db, { userId: USER, scope: 'all' });

        expect(db.activityLog.findMany).toHaveBeenCalledWith({
            where: { OR: [{ userId: USER }, { actorUserId: USER }] },
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 20,
            select: {
                id: true,
                app: true,
                event: true,
                email: true,
                userId: true,
                actorUserId: true,
                actorEmail: true,
                ipAddress: true,
                userAgent: true,
                meta: true,
                createdAt: true,
            },
        });
        // A count over a different filter is how a paginator ends up offering pages
        // that do not exist.
        expect(db.activityLog.count).toHaveBeenCalledWith({
            where: { OR: [{ userId: USER }, { actorUserId: USER }] },
        });
        expect(page).toEqual({ rows: [row()], total: 43, page: 1, pageSize: 20 });
    });

    it('the signin scope narrows the where handed to both calls', async () => {
        const db = stubDb({ rows: [], total: 0 });
        await readActivity(db, { userId: USER, scope: 'signin' });

        const expected = {
            OR: [{ userId: USER }, { actorUserId: USER }],
            event: {
                in: ['signin.success', 'signin.failed', 'code.requested', 'code.refused'],
            },
        };
        expect(db.activityLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expected })
        );
        expect(db.activityLog.count).toHaveBeenCalledWith({ where: expected });
    });

    it('page 3 skips 40 and reports the page it read', async () => {
        const db = stubDb({ rows: [], total: 61 });
        const page = await readActivity(db, { userId: USER, scope: 'all', page: 3 });

        expect(db.activityLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 40, take: 20 })
        );
        expect(page.page).toBe(3);
    });

    it('a page number below 1 reads the first page rather than a negative offset', async () => {
        const db = stubDb({ rows: [], total: 0 });
        const page = await readActivity(db, { userId: USER, scope: 'all', page: -2 });

        expect(db.activityLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
        expect(page.page).toBe(1);
    });

    it('the default page size is the twenty the other dashboard lists use', () => {
        expect(ACTIVITY_PAGE_SIZE).toBe(20);
    });
});

describe('getUserActivity', () => {
    beforeEach(() => {
        requirePermission.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('is gated on VIEW_ACTIVITY_LOG, by name', async () => {
        requirePermission.mockResolvedValue(null);
        await getUserActivity({ userId: USER, scope: 'all' });

        expect(requirePermission).toHaveBeenCalledWith(Permission.VIEW_ACTIVITY_LOG);
    });

    it('without the permission: an empty page, and nothing is read', async () => {
        requirePermission.mockResolvedValue(null);
        expect(await getUserActivity({ userId: USER, scope: 'all' })).toEqual({
            rows: [],
            total: 0,
            page: 1,
            pageSize: 20,
        });
    });
});
