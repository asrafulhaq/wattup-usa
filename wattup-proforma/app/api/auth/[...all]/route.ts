import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

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
 * What is left reachable: get-session and sign-out, which leak nothing.
 */

const BLOCKED = ['email-otp', 'sign-in', 'sign-up'];

function isBlocked(request: Request): boolean {
    const path = new URL(request.url).pathname;
    return BLOCKED.some(segment => path.includes(segment));
}

// Same shape as a genuinely absent route, so probing reveals nothing about
// which endpoints exist.
const notFound = () =>
    new Response('Not Found', {
        status: 404,
        headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
    });

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
    if (isBlocked(request)) return notFound();
    return handler.GET(request);
}

export async function POST(request: Request) {
    if (isBlocked(request)) return notFound();
    return handler.POST(request);
}
