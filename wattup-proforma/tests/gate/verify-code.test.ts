import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/gate/verify-code/route';
import { checkIpLimit } from '@/lib/rate-limit';

import { apiError, fakeSession, gatePost, HOST, observable, SITE } from '../helpers';
import { auth, resetAuth } from '../mocks/auth';
import { directory, member } from '../mocks/member-directory';
import { setRequestHeaders } from '../mocks/next-headers';
import { prisma } from '../mocks/prisma';

/**
 * POST /api/gate/verify-code. Checklist 5.11, 2.19 to 2.21, ADR 0001 section 7.
 *
 * The property: every failure is one response. Better Auth distinguishes a
 * wrong code from an expired one from an address it has never seen
 * (USER_NOT_FOUND is the enumeration oracle ADR section 7 exists to close);
 * this route collapses all of it, and the malformed-body and removed-mid-flow
 * cases with it, into 400 and one body. The real reason goes to the log with
 * the correlation id, and the id is on the response whatever happened.
 */

vi.mock('@/lib/rate-limit', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
    return { ...actual, checkIpLimit: vi.fn() };
});

const PATH = '/api/gate/verify-code';
const MEMBER = 'member@hostproposal.test';
const CODE = '012345';
const REFUSED_BODY = JSON.stringify({ message: 'That code is not valid.' });
const HEADER_NAMES = ['cache-control', 'content-type', 'x-correlation-id', 'x-robots-tag'];

/** What auth.api.signInEmailOTP returns with returnHeaders: the cookies it set. */
function issuedSession(): { headers: Headers; response: unknown } {
    const headers = new Headers();
    headers.append('set-cookie', 'wup.session_token=tok.sig; Path=/; HttpOnly; SameSite=Lax');
    headers.append('set-cookie', 'wup.session_data=eyJ; Path=/; HttpOnly; Max-Age=300');
    return { headers, response: { token: 'tok', user: {} } };
}

/** The re-check finds a current member. */
function currentMember(): void {
    auth.api.getSession.mockResolvedValue(fakeSession({ email: MEMBER }));
    prisma.user.findUnique.mockResolvedValue({ banned: false });
    directory.lookup.mockResolvedValue(member(MEMBER));
}

beforeEach(() => {
    vi.mocked(checkIpLimit).mockReset().mockResolvedValue({ allowed: true });
    setRequestHeaders({ host: HOST, origin: SITE, 'x-forwarded-for': '203.0.113.7' });
});

type Failure = { label: string; arrange?: () => void; request?: () => Request };

const failures: Failure[] = [
    { label: 'INVALID_OTP', arrange: () => auth.api.signInEmailOTP.mockRejectedValue(apiError('INVALID_OTP')) },
    { label: 'OTP_EXPIRED', arrange: () => auth.api.signInEmailOTP.mockRejectedValue(apiError('OTP_EXPIRED')) },
    { label: 'TOO_MANY_ATTEMPTS', arrange: () => auth.api.signInEmailOTP.mockRejectedValue(apiError('TOO_MANY_ATTEMPTS')) },
    { label: 'USER_NOT_FOUND', arrange: () => auth.api.signInEmailOTP.mockRejectedValue(apiError('USER_NOT_FOUND')) },
    {
        label: 'a 413-style error',
        arrange: () => auth.api.signInEmailOTP.mockRejectedValue(apiError('BODY_TOO_LARGE', 'PAYLOAD_TOO_LARGE', 413)),
    },
    { label: 'an error that is not an APIError', arrange: () => auth.api.signInEmailOTP.mockRejectedValue(new TypeError('socket hang up')) },
    { label: 'a thrown value that is not an Error', arrange: () => auth.api.signInEmailOTP.mockRejectedValue('nope') },
    { label: 'a body that is not JSON', request: () => gatePost(PATH, { rawBody: `email=${MEMBER}&code=${CODE}` }) },
    { label: 'a code that is not a string', request: () => gatePost(PATH, { body: { email: MEMBER, code: 12345 } }) },
    { label: 'an email that is not a string', request: () => gatePost(PATH, { body: { email: null, code: CODE } }) },
    { label: 'no content-type', request: () => gatePost(PATH, { body: { email: MEMBER, code: CODE }, contentType: null }) },
    { label: 'the per-IP limit', arrange: () => vi.mocked(checkIpLimit).mockResolvedValue({ allowed: false, reason: 'ip' }) },
    {
        label: 'a member removed mid-flow (the code was right, the re-check says no)',
        arrange: () => {
            auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
            auth.api.getSession.mockResolvedValue(null);
        },
    },
];

describe('enumeration: every failure is the one refusal', () => {
    it('is 400, one body, the same header names, and carries x-correlation-id, byte-identical across all of them', async () => {
        const seen: { label: string; status: number; body: string; headers: [string, string][] }[] = [];

        for (const { label, arrange, request } of failures) {
            resetAuth();
            vi.mocked(checkIpLimit).mockReset().mockResolvedValue({ allowed: true });
            arrange?.();
            const response = await POST(request ? request() : gatePost(PATH, { body: { email: MEMBER, code: CODE } }));
            const { status, body, headerNames, headers } = await observable(response);
            expect(headerNames, label).toEqual(HEADER_NAMES);
            seen.push({ label, status, body, headers });
        }

        const [first, ...rest] = seen;
        expect(first.status).toBe(400);
        expect(first.body).toBe(REFUSED_BODY);
        for (const other of rest) {
            expect({ status: other.status, body: other.body, headers: other.headers }, other.label).toEqual({
                status: first.status,
                body: first.body,
                headers: first.headers,
            });
        }
    });

    it('logs the real reason with the correlation id the caller received, and never in the body', async () => {
        auth.api.signInEmailOTP.mockRejectedValue(apiError('USER_NOT_FOUND'));

        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } }));
        const id = response.headers.get('x-correlation-id');

        expect(await response.text()).not.toContain('USER_NOT_FOUND');
        expect(console.warn).toHaveBeenCalledWith('[gate] verify-code refused', expect.objectContaining({ id, code: 'USER_NOT_FOUND' }));
    });

    it('does not reach Better Auth for a malformed body or a refused IP', async () => {
        await POST(gatePost(PATH, { rawBody: 'x' }));
        vi.mocked(checkIpLimit).mockResolvedValue({ allowed: false, reason: 'ip' });
        await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } }));

        expect(auth.api.signInEmailOTP).not.toHaveBeenCalled();
    });
});

describe('a member removed between request-code and verify-code (checklist 2.20)', () => {
    it('re-checks with the session just issued, bypassing the cookie cache, and signs it out again', async () => {
        auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
        auth.api.getSession.mockResolvedValue(null);

        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } }));

        expect(response.status).toBe(400);
        // The re-check read the cookie Better Auth had just set, not the
        // request's own (which cannot carry it yet), from the database.
        const recheck = auth.api.getSession.mock.calls[0]?.[0];
        expect(recheck?.headers.get('cookie')).toBe('wup.session_token=tok.sig; wup.session_data=eyJ');
        expect(recheck?.query).toEqual({ disableCookieCache: true });
        // And the session that was minted a moment ago does not survive.
        expect(auth.api.signOut).toHaveBeenCalledTimes(1);
        expect(auth.api.signOut.mock.calls[0]?.[0].headers.get('cookie')).toBe('wup.session_token=tok.sig; wup.session_data=eyJ');
    });

    it('the handler itself adds no observable to the refusal: the documented set-cookie expiry is Next merging the cookies() store, outside this unit', async () => {
        // The route's comment records the exception: this branch, on the wire,
        // carries the Max-Age=0 cookies from the sign-out, because the
        // nextCookies plugin writes them into Next's cookies() store and the
        // route module merges that store into whatever Response is returned.
        // None of that machinery runs when POST() is called directly, so the
        // pin here is that OUR Response is the same as every other refusal; the
        // wire-level cookie expiry is checklist 2.4x's live evidence.
        auth.api.signInEmailOTP.mockRejectedValue(apiError('INVALID_OTP'));
        const wrongCode = await observable(await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } })));

        resetAuth();
        auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
        auth.api.getSession.mockResolvedValue(null);
        const removed = await observable(await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } })));

        expect(removed).toEqual(wrongCode);
        expect(removed.headerNames).not.toContain('set-cookie');
    });

    it.todo(
        'on the wire this branch carries the session-expiry set-cookie (nextCookies + Next route module); observable only in a running server, not from POST() directly',
    );

    it('still refuses, and still signs out, when the re-check itself throws', async () => {
        auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
        auth.api.getSession.mockRejectedValue(new Error('database gone'));

        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } }));

        expect(await observable(response)).toMatchObject({ status: 400, body: REFUSED_BODY });
        expect(auth.api.signOut).toHaveBeenCalledTimes(1);
    });
});

describe('success', () => {
    beforeEach(() => {
        auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
        currentMember();
    });

    it('passes the normalised address and the code AS A STRING to Better Auth, with the request headers (checklist 2.29)', async () => {
        setRequestHeaders({ host: HOST, origin: SITE, 'user-agent': 'vitest' });

        await POST(gatePost(PATH, { body: { email: '  Member@HostProposal.TEST ', code: CODE } }));

        expect(auth.api.signInEmailOTP).toHaveBeenCalledTimes(1);
        const call = auth.api.signInEmailOTP.mock.calls[0]?.[0];
        expect(call?.body).toEqual({ email: MEMBER, otp: CODE });
        expect(call?.body.otp).toBe('012345');
        expect(call?.returnHeaders).toBe(true);
        expect(call?.headers.get('user-agent')).toBe('vitest');
    });

    it('answers 200 with a same-site redirect and the same header names as a refusal', async () => {
        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE, next: '/tool/?x=1' } }));
        const { status, body, headerNames } = await observable(response);

        expect(status).toBe(200);
        expect(body).toBe(JSON.stringify({ redirectTo: '/tool/?x=1' }));
        expect(headerNames).toEqual(HEADER_NAMES);
        expect(auth.api.signOut).not.toHaveBeenCalled();
    });

    it.each([
        ['//evil.example', '/tool/'],
        ['https://evil.example/', '/tool/'],
        ['/\t/evil.example', '/tool/'],
        [undefined, '/tool/'],
        ['/tool/js/model.js', '/tool/js/model.js'],
    ])('never redirects off-site: next=%j -> %s (checklist 2.23)', async (next, redirectTo) => {
        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE, ...(next === undefined ? {} : { next }) } }));
        expect(await response.json()).toEqual({ redirectTo });
    });

    it('ignores a next that is not a string', async () => {
        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE, next: ['//evil.example'] } }));
        expect(await response.json()).toEqual({ redirectTo: '/tool/' });
    });
});

describe('before the body is read', () => {
    it('403 for a request that is not from this site, and Better Auth is never called', async () => {
        auth.api.signInEmailOTP.mockResolvedValue(issuedSession());
        currentMember();

        const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE }, headers: { origin: 'null' } }));

        expect(await observable(response)).toMatchObject({ status: 403, body: JSON.stringify({ message: 'Forbidden' }) });
        expect(checkIpLimit).not.toHaveBeenCalled();
        expect(auth.api.signInEmailOTP).not.toHaveBeenCalled();
    });

    it('503 naming the missing variable (checklist 2.9)', async () => {
        vi.stubEnv('BETTER_AUTH_SECRET', '');
        try {
            const response = await POST(gatePost(PATH, { body: { email: MEMBER, code: CODE } }));
            expect(response.status).toBe(503);
            expect(await response.text()).toContain('BETTER_AUTH_SECRET');
            expect(auth.api.signInEmailOTP).not.toHaveBeenCalled();
        } finally {
            vi.unstubAllEnvs();
        }
    });
});
