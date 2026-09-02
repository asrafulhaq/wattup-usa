import { toNextJsHandler } from 'better-auth/next-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/auth/[...all]/route';

import { SITE } from '../helpers';

/**
 * app/api/auth/[...all]: Better Auth's own endpoints, allowlisted to two.
 * ADR 0001 section 7. Everything else, the OTP routes that leak whether an
 * address is a user and the user-mutation routes that could write to the
 * shared user table, is a 404 shaped like a route that does not exist.
 *
 * toNextJsHandler is replaced with a recorder, so what is under test is only
 * the allowlist in front of it.
 */

vi.mock('better-auth/next-js', () => {
    const passthrough = vi.fn(async (request: Request) => new Response(`passthrough ${request.method} ${new URL(request.url).pathname}`));
    return {
        toNextJsHandler: vi.fn(() => ({ GET: passthrough, POST: passthrough, PATCH: passthrough, PUT: passthrough, DELETE: passthrough })),
        nextCookies: vi.fn(() => ({ id: 'next-cookies' })),
    };
});

function passthrough() {
    const built = vi.mocked(toNextJsHandler).mock.results[0]?.value;
    if (!built) throw new Error('[tests] toNextJsHandler was not called when the route module loaded');
    return vi.mocked(built.GET);
}

const get = (path: string) => GET(new Request(`${SITE}${path}`));
const post = (path: string) => POST(new Request(`${SITE}${path}`, { method: 'POST' }));

beforeEach(() => {
    passthrough().mockClear();
});

describe('the allowlist', () => {
    it('passes GET /api/auth/get-session through', async () => {
        const response = await get('/api/auth/get-session');

        expect(await response.text()).toBe('passthrough GET /api/auth/get-session');
        expect(passthrough()).toHaveBeenCalledTimes(1);
    });

    it('passes POST /api/auth/sign-out through, with or without a trailing slash', async () => {
        expect(await (await post('/api/auth/sign-out')).text()).toBe('passthrough POST /api/auth/sign-out');
        expect(await (await post('/api/auth/sign-out/')).text()).toBe('passthrough POST /api/auth/sign-out/');
        expect(passthrough()).toHaveBeenCalledTimes(2);
    });

    const refused = [
        '/api/auth/update-user',
        '/api/auth/sign-up/email',
        '/api/auth/sign-in/email-otp',
        '/api/auth/email-otp/send-verification-otp',
        '/api/auth/email-otp/verify-email',
        '/api/auth/delete-user',
        '/api/auth/list-sessions',
        '/api/auth//sign-out',
        '/api/auth/sign-out/../update-user',
        '/api/auth/%73ign-out',
        '/api/auth/get-session/extra',
        '/api/auth/',
        '/api/auth',
    ];

    it.each(refused)('%s is 404 for GET and POST, and Better Auth never sees it', async (path) => {
        for (const response of [await get(path), await post(path)]) {
            expect(response.status).toBe(404);
            expect(await response.text()).toBe('Not Found');
            expect(response.headers.get('cache-control')).toBe('no-store');
            expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
        }
        expect(passthrough()).not.toHaveBeenCalled();
    });

    it('every refusal is the same bytes, so probing reveals nothing about which endpoints exist', async () => {
        const shape = async (response: Response) => ({
            status: response.status,
            body: await response.text(),
            headers: Object.fromEntries(response.headers),
        });
        const reference = await shape(await get('/api/auth/this-route-does-not-exist'));

        for (const path of refused) {
            expect(await shape(await get(path)), path).toEqual(reference);
        }
    });
});
