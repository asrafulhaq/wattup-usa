import { headers } from 'next/headers';
import { after } from 'next/server';

import { activityContext, logActivity, type ActivityContext, type SignInFailedReason } from '@/lib/activity-log';
import { maskEmail } from '@/lib/email';
import { missingRequiredEnv } from '@/lib/env';
import prisma from '@/lib/prisma';
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
 *   5. audit        lib/activity-log.ts, one row per request that named an
 *                   address: signin.success with the user id, or signin.failed
 *                   with meta.reason (checklist 4b.5). Unlike request-code, the
 *                   decision here has to run on the response path, because the
 *                   cookie is set by it; so only the WRITE is deferred, with
 *                   after(), and the response is complete before it starts.
 *                   The row can neither slow nor change the answer. A malformed
 *                   body writes nothing: there is no address to attribute it to.
 *
 * Before any of it, lib/env.ts: a missing required variable is a 503 naming it,
 * and `auth` is imported only after that check (see request-code). Then
 * lib/gate.ts isSameOrigin: a request whose Origin, else Referer, does not
 * name this host is 403 Forbidden (checklist 5.8), the one answer here that is
 * not the generic 400, and it turns on where the request came from, never on
 * the address or code it carried. Then the per-IP limit, which is hit for
 * every same-origin request whether or not its body parsed; the body is read
 * before it so a refusal there can still be attributed to the address it named.
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

/**
 * Better Auth's error codes, as the audit row names them. Anything not listed,
 * including a throw that is not an APIError at all, is 'unknown'; the code
 * itself, when there was one, rides along in meta.code so nothing is lost.
 */
const BETTER_AUTH_FAILURES: Record<string, SignInFailedReason> = {
    INVALID_OTP: 'invalid_code',
    OTP_EXPIRED: 'expired',
    TOO_MANY_ATTEMPTS: 'attempts_exhausted',
    USER_NOT_FOUND: 'not_member',
};

function signInFailedReason(code: string | undefined): SignInFailedReason {
    return (code !== undefined && BETTER_AUTH_FAILURES[code]) || 'unknown';
}

/** The signin.failed row. Scheduled with after(), never awaited on the response path. */
function failed(context: ActivityContext, email: string, reason: SignInFailedReason, code?: string): Promise<void> {
    return logActivity({
        ...context,
        event: 'signin.failed',
        email,
        meta: { reason, ...(code === undefined ? {} : { code }) },
    });
}

/**
 * The row for step 3 saying no. requireMember is opaque on purpose (a caller
 * never learns why it was null), so the reason is worked out here, after the
 * response, from the user row: Better Auth accepted the code, so a row for
 * this address exists unless it was deleted mid-flow, and if it is banned
 * that is the reason; otherwise the directory no longer lists them. A
 * re-check that THREW is neither: it is 'unknown', and no row is read.
 */
async function recheckFailed(context: ActivityContext, email: string, threw: boolean): Promise<void> {
    if (threw) return failed(context, email, 'unknown');
    const user = await prisma.user
        .findUnique({ where: { email }, select: { id: true, banned: true } })
        .catch(() => null);
    return logActivity({
        ...context,
        event: 'signin.failed',
        email,
        userId: user?.id ?? null,
        meta: { reason: user?.banned === true ? 'banned' : 'not_member' },
    });
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

    // What every audit row for this request carries: three header reads.
    const context = activityContext(request.headers, id);

    // 1. Normalise. Read before the IP counter so a refusal there can still
    //    say which address it was for; null is refused below, after the
    //    counter has been hit, so a malformed body still counts.
    const input = await readInput(request);

    // Per-IP limit, this route too (checklist 5.2). Better Auth's five-attempt
    // counter only exists once a code has been issued; an address that never had
    // one has no counter at all, so bound how often one address space may try.
    // A breach is the same refusal as a wrong code, never a distinct answer.
    const ipLimit = await checkIpLimit(clientIp(request.headers), 'verify');
    if (!ipLimit.allowed) {
        console.warn('[gate] verify-code refused', { id, reason: 'RATE_LIMIT_IP' });
        if (input) after(() => failed(context, input.email, 'rate_limited_ip'));
        return refused(id);
    }

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
        const described = describeError(error);
        console.warn('[gate] verify-code refused', { id, email: masked, ...described });
        after(() => failed(context, email, signInFailedReason(described.code), described.code));
        return refused(id);
    }

    // 3. Re-check, with the session just issued. A throw is no membership.
    const sessionHeaders = new Headers(requestHeaders);
    sessionHeaders.set('cookie', cookieHeaderFrom(issued.getSetCookie()));

    let recheckThrew = false;
    const member = await requireMember(sessionHeaders).catch((error: unknown) => {
        recheckThrew = true;
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
        after(() => recheckFailed(context, email, recheckThrew));
        return refused(id);
    }

    // 4. The answer, with the audit row (5) scheduled to follow it.
    console.info('[gate] verify-code accepted', { id, email: masked });
    after(() => logActivity({ ...context, event: 'signin.success', email, userId: member.user.id }));
    return respond(id, 200, JSON.stringify({ redirectTo: safeNext(next) }));
}
