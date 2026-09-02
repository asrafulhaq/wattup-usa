import { headers } from 'next/headers';

import { maskEmail } from '@/lib/email';
import { missingRequiredEnv } from '@/lib/env';
import { checkIpLimit, clientIp } from '@/lib/rate-limit';
import {
    correlationId,
    describeError,
    describeOrigin,
    forbidden,
    GATE_RESPONSE_HEADERS,
    isSameOrigin,
    requireMember,
    safeNext,
    serviceUnavailable,
} from '@/lib/gate';
import { normalizeEmail } from '@/lib/member-directory';

/**
 * POST /api/gate/verify-code        body: { email, code, next? }
 *
 * The second half of the gate. ADR 0001 section 7.
 *
 * Every failure is one response: 400 and one fixed body. Wrong code, expired
 * code, no code ever issued for that address, attempts exhausted, an address
 * that is not a user, a body that is not what it should be, a member removed
 * between request and verify: all of it is `That code is not valid.` The real
 * reason is logged with a correlation id, and the id is returned in
 * x-correlation-id on success and failure alike, so the header's presence says
 * nothing either. Checklist 2.19 and 2.21.
 *
 * In order:
 *
 *   1. normalise    the address is trimmed and lowercased; the code is a STRING
 *                   and stays one, so '012345' is never 12345 (checklist 2.29).
 *   2. Better Auth  auth.api.signInEmailOTP, server side, with the request
 *                   headers so the session row records the client. It consumes
 *                   the stored code atomically, compares in constant time
 *                   (dist/plugins/email-otp/otp-token.mjs, checklist 2.24), and
 *                   on success creates the session and sets its cookie. The
 *                   cookie reaches the browser through the nextCookies plugin:
 *                   Better Auth's after-hook copies every set-cookie it produced
 *                   into Next's cookies() store, and Next merges that store into
 *                   whatever Response this handler returns
 *                   (better-auth/dist/integrations/next-js.mjs, then
 *                   next/dist/server/route-modules/app-route/module.js).
 *   3. re-check     requireMember (lib/gate.ts): the session just issued, read
 *                   back from the database, for a user who is not banned and is
 *                   still in the directory. Checklist 2.20. Next's headers() does
 *                   not reflect a cookie set during the same request, so the
 *                   check is given the request headers with the cookie Better
 *                   Auth returned spliced in. Not a current member: the session
 *                   is deleted again and the answer is the same 400.
 *   4. answer       200 { redirectTo }, a same-site path (safeNext).
 *
 * Before any of it, lib/env.ts: a missing required variable is a 503 naming it,
 * and `auth` is imported only after that check (see request-code). Then
 * lib/gate.ts isSameOrigin: a request whose Origin, else Referer, does not
 * name this host is 403 Forbidden (checklist 5.8), the one answer here that is
 * not the generic 400, and it turns on where the request came from, never on
 * the address or code it carried.
 */

export const runtime = 'nodejs';
// Room for the deferred work (limits, directory, Better Auth's round trips, the
// nested Resend send) on platforms with short function defaults.
export const maxDuration = 30;

// Serialised once, so every failure returns these exact bytes.
const REFUSED_BODY = JSON.stringify({ message: 'That code is not valid.' });

const respond = (id: string, status: number, body: string) =>
    new Response(body, {
        status,
        headers: {
            ...GATE_RESPONSE_HEADERS,
            'content-type': 'application/json; charset=utf-8',
            'x-correlation-id': id,
        },
    });

const refused = (id: string) => respond(id, 400, REFUSED_BODY);

type Input = { email: string; code: string; next: string | undefined };

/**
 * The input, or null for anything that is not a JSON object with string email
 * and code fields. null is refused like every other failure. The content type
 * must be JSON so a cross-site form post, which can only declare text/plain,
 * cannot sign a victim's browser in as the attacker.
 */
async function readInput(request: Request): Promise<Input | null> {
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return null;
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null) return null;
    const { email, code, next } = body as { email?: unknown; code?: unknown; next?: unknown };
    if (typeof email !== 'string' || typeof code !== 'string') return null;
    return { email: normalizeEmail(email), code, next: typeof next === 'string' ? next : undefined };
}

/**
 * A cookie request header carrying the cookies a set-cookie list issued: the
 * name=value pair of each, attributes dropped. This is what lets the re-check
 * read the session that was created a moment ago in this same request.
 */
function cookieHeaderFrom(setCookies: string[]): string {
    return setCookies
        .map((entry) => entry.split(';', 1)[0]?.trim() ?? '')
        .filter((pair) => pair.length > 0)
        .join('; ');
}

export async function POST(request: Request) {
    const missing = missingRequiredEnv();
    if (missing.length > 0) return serviceUnavailable(missing);

    const id = correlationId();

    // Origin. Not from this site: 403, before the body is even read.
    if (!isSameOrigin(request.headers)) {
        console.warn('[gate] verify-code refused', { id, reason: 'CROSS_ORIGIN', ...describeOrigin(request.headers) });
        return forbidden(id);
    }

    // Per-IP limit, this route too (checklist 5.2). Better Auth's five-attempt
    // counter only exists once a code has been issued; an address that never had
    // one has no counter at all, so bound how often one address space may try.
    // A breach is the same refusal as a wrong code, never a distinct answer.
    const ipLimit = await checkIpLimit(clientIp(request.headers));
    if (!ipLimit.allowed) {
        console.warn('[gate] verify-code refused', { id, reason: 'RATE_LIMIT_IP' });
        return refused(id);
    }

    // 1. Normalise.
    const input = await readInput(request);
    if (!input) {
        console.warn('[gate] verify-code refused', { id, reason: 'MALFORMED_BODY' });
        return refused(id);
    }
    const { email, code, next } = input;
    const masked = maskEmail(email);
    const requestHeaders = await headers();

    const { auth } = await import('@/lib/auth');

    // 2. Better Auth. One catch for everything it can throw: INVALID_OTP,
    //    OTP_EXPIRED, TOO_MANY_ATTEMPTS, USER_NOT_FOUND, validation, database.
    let issued: Headers;
    try {
        const result = await auth.api.signInEmailOTP({
            body: { email, otp: code },
            headers: requestHeaders,
            returnHeaders: true,
        });
        issued = result.headers;
    } catch (error) {
        console.warn('[gate] verify-code refused', { id, email: masked, ...describeError(error) });
        return refused(id);
    }

    // 3. Re-check, with the session just issued. A throw is no membership.
    const sessionHeaders = new Headers(requestHeaders);
    sessionHeaders.set('cookie', cookieHeaderFrom(issued.getSetCookie()));

    const member = await requireMember(sessionHeaders).catch((error: unknown) => {
        console.error('[gate] verify-code: membership re-check failed', {
            id,
            email: masked,
            ...describeError(error),
        });
        return null;
    });

    if (!member) {
        // The code was right but the person is no longer a member, or never
        // was one in the user table's view. The session must not survive: sign
        // out deletes the row and expires the cookie that was set a moment ago.
        // That expiry is the one observable this branch adds to the generic 400,
        // and the only party who can reach this branch already holds the mailed
        // code for that address.
        await auth.api.signOut({ headers: sessionHeaders }).catch((error: unknown) => {
            console.error('[gate] verify-code: sign-out after failed re-check failed', {
                id,
                email: masked,
                ...describeError(error),
            });
        });
        console.warn('[gate] verify-code refused', { id, email: masked, reason: 'NOT_A_CURRENT_MEMBER' });
        return refused(id);
    }

    // 4. The answer.
    console.info('[gate] verify-code accepted', { id, email: masked });
    return respond(id, 200, JSON.stringify({ redirectTo: safeNext(next) }));
}
