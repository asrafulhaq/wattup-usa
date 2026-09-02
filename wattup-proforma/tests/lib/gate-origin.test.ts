import { describe, expect, it } from 'vitest';

import { describeError, describeOrigin, forbidden, isSameOrigin, serviceUnavailable } from '@/lib/gate';

import { apiError } from '../helpers';

/**
 * isSameOrigin (checklist 5.8) and the small helpers around it in lib/gate.ts.
 * The comparison is against the request's OWN host, x-forwarded-host first,
 * so a preview deployment passes with no configuration, and against nothing
 * else.
 */

const HOST = 'hostproposal.wattupusa.com';

describe('isSameOrigin', () => {
    it.each([
        ['a matching Origin', { host: HOST, origin: `https://${HOST}` }, true],
        ['a matching Origin in another case', { host: HOST, origin: `https://${HOST.toUpperCase()}` }, true],
        ['a foreign Origin', { host: HOST, origin: 'https://evil.example' }, false],
        ['Origin: null (an opaque origin)', { host: HOST, origin: 'null' }, false],
        ['an Origin that is not a URL', { host: HOST, origin: HOST }, false],
        ['no Origin, a matching Referer', { host: HOST, referer: `https://${HOST}/login?next=%2Ftool%2F` }, true],
        ['no Origin, a foreign Referer', { host: HOST, referer: 'https://evil.example/' }, false],
        ['neither header', { host: HOST }, false],
        ['a foreign Origin beside a matching Referer: Origin wins', { host: HOST, origin: 'https://evil.example', referer: `https://${HOST}/` }, false],
        ['no host at all', { origin: `https://${HOST}` }, false],
        ['the port is part of the host', { host: 'localhost:3001', origin: 'http://localhost:3001' }, true],
        ['a different port is a different host', { host: 'localhost:3001', origin: 'http://localhost:3000' }, false],
        ['a subdomain is a different host', { host: HOST, origin: 'https://evil.hostproposal.wattupusa.com' }, false],
    ])('%s -> %s', (_label, headers, expected) => {
        expect(isSameOrigin(new Headers(headers))).toBe(expected);
    });

    it('prefers x-forwarded-host over host, taking the first of a list', () => {
        const preview = 'wattup-proforma-abc123.vercel.app';

        expect(isSameOrigin(new Headers({ host: 'internal.lambda:3000', 'x-forwarded-host': preview, origin: `https://${preview}` }))).toBe(true);
        expect(isSameOrigin(new Headers({ host: 'internal.lambda:3000', 'x-forwarded-host': preview, origin: 'https://internal.lambda:3000' }))).toBe(false);
        expect(isSameOrigin(new Headers({ host: HOST, 'x-forwarded-host': `${preview}, ${HOST}`, origin: `https://${preview}` }))).toBe(true);
    });
});

describe('describeOrigin: what is logged when the check says no', () => {
    it('reduces the Referer to its host and keeps Origin verbatim', () => {
        expect(describeOrigin(new Headers({ host: HOST, origin: 'https://evil.example', referer: 'https://evil.example/path?secret=1' }))).toEqual({
            host: HOST,
            origin: 'https://evil.example',
            referer: 'evil.example',
        });
        expect(describeOrigin(new Headers())).toEqual({ host: null, origin: null, referer: null });
    });
});

describe('describeError: the loggable shape of what Better Auth throws', () => {
    it('keeps the status name and the code of an APIError', () => {
        expect(describeError(apiError('INVALID_OTP'))).toEqual({
            name: 'APIError',
            status: 'BAD_REQUEST',
            code: 'INVALID_OTP',
            message: 'invalid otp',
        });
    });

    it('a plain Error has no status or code; a non-Error is stringified', () => {
        expect(describeError(new TypeError('socket hang up'))).toEqual({ name: 'TypeError', message: 'socket hang up' });
        expect(describeError('nope')).toEqual({ name: 'unknown', message: 'nope' });
    });
});

describe('the two fixed responses', () => {
    it('forbidden: 403, one body, the correlation id, no-store and noindex', async () => {
        const response = forbidden('id-1');

        expect(response.status).toBe(403);
        expect(await response.text()).toBe('{"message":"Forbidden"}');
        expect(Object.fromEntries(response.headers)).toEqual({
            'cache-control': 'no-store',
            'x-robots-tag': 'noindex, nofollow',
            'content-type': 'application/json; charset=utf-8',
            'x-correlation-id': 'id-1',
        });
    });

    it('serviceUnavailable: 503 plain text naming every missing variable', async () => {
        const response = serviceUnavailable(['RESEND_API_KEY', 'MAIL_FROM']);

        expect(response.status).toBe(503);
        expect(await response.text()).toBe('Service unavailable: missing required environment variable(s): RESEND_API_KEY, MAIL_FROM\n');
        expect(response.headers.get('cache-control')).toBe('no-store');
    });
});
