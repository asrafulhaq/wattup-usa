import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Finding F16, checklist B.15: the dashboard resolves a session from the database, not
 * from the five minute signed cookie cache.
 *
 * lib/auth.ts keeps cookieCache enabled, which is right for the cheap identity reads it
 * was added for, and proxy.ts decides the dashboard redirect from cookie presence alone,
 * which is right because it may not touch the database. Together they meant a session_data
 * cookie captured while a session was live kept rendering dashboard pages for up to five
 * minutes after that session was revoked. The fix is one option on the one call every
 * dashboard read goes through, so this test pins the option itself: it is the sort of
 * thing a later refactor drops without noticing, and nothing else would fail.
 *
 * Since the performance audit the flag carries a second load. getSession now returns
 * banned and banExpires, and lib/permissions-server.ts resolves a caller's permissions
 * from them instead of re-reading the "user" row. With disableCookieCache removed those
 * two fields, and role beside them, could be five minutes old, and the resolver would be
 * answering an authorisation question from a stale cookie. So the flag is no longer only
 * about read staleness, and the tests below pin the flag and the two fields together.
 */

const { getSessionApi } = vi.hoisted(() => ({ getSessionApi: vi.fn() }));

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionApi, signOut: vi.fn() } } }));
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('next/headers', () => ({
    headers: async () => new Headers({ cookie: 'wattup.session_token=abc' }),
    cookies: async () => ({ delete: vi.fn(), get: vi.fn() }),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const SESSION = {
    user: {
        id: 'u1',
        email: 'someone@wattupusa.com',
        role: 'ADMIN',
        name: 'Someone',
        image: null,
        banned: false,
        banExpires: null,
    },
};

let actions: typeof import('@/app/_actions/auth-actions');

beforeEach(async () => {
    vi.clearAllMocks();
    actions ??= await import('@/app/_actions/auth-actions');
});

describe('getSession', () => {
    it('asks Better Auth to bypass the cookie cache, so a revoked session stops working at once', async () => {
        getSessionApi.mockResolvedValue(SESSION);

        await actions.getSession();

        expect(getSessionApi).toHaveBeenCalledTimes(1);
        const [args] = getSessionApi.mock.calls[0];
        expect(args.query).toEqual({ disableCookieCache: true });
        expect(args.headers).toBeInstanceOf(Headers);
    });

    it('returns identity only, never the permissions, which are resolved separately', async () => {
        getSessionApi.mockResolvedValue(SESSION);

        const session = await actions.getSession();

        expect(session).toEqual({
            id: 'u1',
            email: 'someone@wattupusa.com',
            role: 'ADMIN',
            name: 'Someone',
            image: null,
            banned: false,
            banExpires: null,
        });
    });

    it('is null once the session row is gone, which is what a replayed cookie now gets', async () => {
        getSessionApi.mockResolvedValue(null);

        expect(await actions.getSession()).toBeNull();
    });
});

/**
 * Perf audit finding 1. Better Auth already reads banned and banExpires out of the same
 * "user" row it reads role from, and lib/permissions-server.ts resolves the caller's
 * permissions from them rather than selecting the identical row a second time. If these
 * stop being carried through, that resolver silently falls back to the extra round trip
 * it was written to remove, and nothing else in the suite would notice.
 */
describe('getSession carries the ban state the permission resolver needs', () => {
    it('passes a live ban through, with its expiry as a Date', async () => {
        const expires = new Date('2030-01-01T00:00:00.000Z');
        getSessionApi.mockResolvedValue({
            user: { ...SESSION.user, banned: true, banExpires: expires },
        });

        const session = await actions.getSession();

        expect(session?.banned).toBe(true);
        expect(session?.banExpires).toBeInstanceOf(Date);
        expect(session?.banExpires?.toISOString()).toBe('2030-01-01T00:00:00.000Z');
    });

    it('parses an ISO string expiry, so a serialised Date is not read as "no expiry"', async () => {
        getSessionApi.mockResolvedValue({
            user: { ...SESSION.user, banned: true, banExpires: '2030-06-01T12:00:00.000Z' },
        });

        const session = await actions.getSession();

        expect(session?.banExpires?.toISOString()).toBe('2030-06-01T12:00:00.000Z');
    });

    it('is null, not an Invalid Date, when the expiry is absent or unusable', async () => {
        for (const banExpires of [undefined, null, 'not a date', {}]) {
            getSessionApi.mockResolvedValue({
                user: { ...SESSION.user, banned: true, banExpires },
            });

            expect((await actions.getSession())?.banExpires).toBeNull();
        }
    });

    it('reports banned as null rather than false when the field is absent', async () => {
        const user = { ...SESSION.user } as Record<string, unknown>;
        delete user.banned;
        getSessionApi.mockResolvedValue({ user });

        expect((await actions.getSession())?.banned).toBeNull();
    });
});
