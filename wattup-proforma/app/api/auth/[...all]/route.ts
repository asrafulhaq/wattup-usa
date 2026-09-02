import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';
import { GATE_RESPONSE_HEADERS } from '@/lib/gate';

/**
 * Better Auth's own endpoints, with the one-time-code routes deliberately closed.
 *
 * Better Auth's OTP endpoints leak whether an address belongs to a user. From
 * packages/better-auth/src/plugins/email-otp/routes.ts:
 *
 *     if (!user) {
 *       // "safe to leak the existence of a user, given the user has already
 *       //  the OTP from the email"
 *       throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
 *     }
 *
 * Their threat model assumes the caller already holds a mailed code. Ours is the
 * opposite: a non-member must be indistinguishable from a member. So those paths
 * are unreachable from the browser, and app/api/gate/* calls them server-side and
 * normalises every observable. See ADR 0001 section 7.
 *
 * What is reachable: get-session and sign-out, and nothing else (allowlist).
 */

// An allowlist, not a blocklist. Better Auth mounts far more than the OTP routes
// (update-user, change-email, delete-user, list/revoke-sessions, ...), and a
// pro-forma session must not be able to write to the shared `user` table
// through any of them. Exactly two paths leak nothing and are needed:
const ALLOWED = new Set(['/get-session', '/sign-out']);

function isAllowed(request: Request): boolean {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth/, '').replace(/\/+$/, '') || '/';
    return ALLOWED.has(path);
}

// Same shape as a genuinely absent route, so probing reveals nothing about
// which endpoints exist.
const notFound = () =>
    new Response('Not Found', {
        status: 404,
        headers: GATE_RESPONSE_HEADERS,
    });

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
    if (!isAllowed(request)) return notFound();
    return handler.GET(request);
}

export async function POST(request: Request) {
    if (!isAllowed(request)) return notFound();
    return handler.POST(request);
}
