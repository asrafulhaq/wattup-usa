import { expect } from 'vitest';

import type { Session } from '@/lib/auth';

/** The site the tests pretend to be. A .test name resolves nowhere. */
export const HOST = 'hostproposal.test';
export const SITE = `https://${HOST}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * A POST to a gate route the way app/login sends one: same-origin, JSON.
 * `body` is serialised; `rawBody` is sent as is (for a body that is not JSON);
 * `contentType: null` sends none. Extra headers override the defaults.
 */
export function gatePost(
    path: string,
    init: {
        body?: unknown;
        rawBody?: string;
        contentType?: string | null;
        headers?: Record<string, string>;
    } = {},
): Request {
    const headers = new Headers({ host: HOST, origin: SITE });
    const contentType = init.contentType === undefined ? 'application/json' : init.contentType;
    if (contentType !== null) headers.set('content-type', contentType);
    for (const [name, value] of Object.entries(init.headers ?? {})) headers.set(name, value);
    const body = init.rawBody ?? (init.body === undefined ? undefined : JSON.stringify(init.body));
    return new Request(`${SITE}${path}`, { method: 'POST', headers, body });
}

/**
 * A Better Auth session as auth.api.getSession returns it, for a signed-in
 * member. Field set is Better Auth's core schema, which lib/auth.ts leaves
 * unextended.
 */
export function fakeSession(overrides: { email?: string; userId?: string } = {}): Session {
    const now = new Date('2026-09-03T10:00:00.000Z');
    const email = overrides.email ?? 'member@hostproposal.test';
    const userId = overrides.userId ?? 'user_member';
    return {
        session: {
            id: 'session_1',
            createdAt: now,
            updatedAt: now,
            userId,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            token: 'token_1',
            ipAddress: '203.0.113.7',
            userAgent: 'vitest',
        },
        user: {
            id: userId,
            createdAt: now,
            updatedAt: now,
            email,
            emailVerified: true,
            name: 'A Member',
            image: null,
        },
    };
}

/**
 * The shape of what Better Auth throws: a better-call APIError, duck-typed the
 * way lib/gate.ts describeError reads it. `status` is the HTTP status NAME,
 * `body.code` the Better Auth error code.
 */
export function apiError(code: string, status = 'BAD_REQUEST', statusCode = 400): Error {
    const error = new Error(code.toLowerCase().replaceAll('_', ' '));
    error.name = 'APIError';
    return Object.assign(error, { status, statusCode, body: { code, message: error.message } });
}

/**
 * Everything a caller can observe about a response, with the one value that
 * legitimately differs per request (x-correlation-id) replaced by a marker
 * after it has been checked to be a UUID. Two responses that toEqual() here
 * are indistinguishable on the wire.
 */
export async function observable(response: Response): Promise<{
    status: number;
    body: string;
    headerNames: string[];
    headers: [string, string][];
}> {
    const headers: [string, string][] = [];
    for (const [name, value] of response.headers) {
        if (name === 'x-correlation-id') {
            expect(value).toMatch(UUID);
            headers.push([name, '<uuid>']);
        } else {
            headers.push([name, value]);
        }
    }
    headers.sort(([a], [b]) => a.localeCompare(b));
    return {
        status: response.status,
        body: await response.text(),
        headerNames: headers.map(([name]) => name),
        headers,
    };
}
