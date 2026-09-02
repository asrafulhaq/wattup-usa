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
    user: { id: 'u1', email: 'someone@wattupusa.com', role: 'ADMIN', name: 'Someone', image: null },
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
        });
    });

    it('is null once the session row is gone, which is what a replayed cookie now gets', async () => {
        getSessionApi.mockResolvedValue(null);

        expect(await actions.getSession()).toBeNull();
    });
});
