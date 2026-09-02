import { after } from 'next/server';

import { maskEmail } from '@/lib/email';
import { missingRequiredEnv } from '@/lib/env';
import {
    correlationId,
    describeError,
    describeOrigin,
    forbidden,
    GATE_RESPONSE_HEADERS,
    isSameOrigin,
    serviceUnavailable,
} from '@/lib/gate';
import { getMemberDirectory, normalizeEmail } from '@/lib/member-directory';
import { checkEmailLimits, checkIpLimit, clientIp } from '@/lib/rate-limit';

/**
 * POST /api/gate/request-code        body: { email }
 *
 * The first half of the gate, and the reason Better Auth's own OTP endpoints
 * are closed in app/api/auth/[...all]: those leak whether an address belongs to
 * a user, and this route exists so nothing does. ADR 0001 section 7.
 *
 * Every request gets the same answer, 200 and one fixed body, and it gets it
 * BEFORE anything that depends on who asked has run. ADR section 7 said
 * "respond first, send after", on the premise that the member branch would
 * cost one extra insert. Measured, it did not: for a directory member Better
 * Auth's sendVerificationOTP performs several database round trips, and
 * against a remote database the member response took about 1.1 s to the
 * non-member's 3 ms. Against an in-region database that gap shrinks to a few
 * milliseconds, but a few milliseconds is a signal a patient caller can
 * average out, and checklist 2.42 asks for indistinguishable, not small. So
 * the rule here is "respond first, DECIDE after": the response is produced
 * from the request alone, and the whole decision runs in after().
 *
 *   on the response path
 *     1. env check     lib/env.ts. A missing required variable is a 503 naming
 *                      it (checklist 2.9). Synchronous, and first: a broken
 *                      deployment must fail visibly. `auth` is imported only
 *                      after this, because lib/auth.ts throws at load when
 *                      BETTER_AUTH_SECRET is missing and a 500 would hide the 503.
 *     2. origin        lib/gate.ts isSameOrigin: the request's Origin, else its
 *                      Referer, must name this host, or the answer is 403 and
 *                      nothing is scheduled (checklist 5.8). The one response
 *                      that differs, and it differs on where the request came
 *                      from, never on the address it carried.
 *     3. normalise     trim + lowercase. A body that is not JSON, or an email
 *                      that is not a string, schedules nothing.
 *     4. answer        the generic 200, same bytes every time.
 *
 *   in after(), once the response has gone out
 *     5. IP limit      lib/rate-limit.ts checkIpLimit, for EVERY request that
 *                      got this far, member or not: a request for an address
 *                      that is not a member is a probe, and probes are what the
 *                      per-IP limit counts. Over it, nothing is sent and nothing
 *                      is said (checklist 5.5). The limiter fails open: if its
 *                      store is down the request continues (checklist 5.7).
 *     6. directory     lib/member-directory.ts. Not a current, active member:
 *                      nothing is sent. Better Auth is never told the address.
 *     7. address limits  checkEmailLimits, for a member only: the 60 second gap
 *                      since the last send, then the five-per-hour counter. A
 *                      non-member's address is never counted, because nothing
 *                      would have been sent to it. Same silence on a breach.
 *     8. Better Auth   auth.api.sendVerificationOTP, server side. It stores the
 *                      hashed code and calls the lib/auth.ts callback, which
 *                      schedules the email with a nested after() of its own.
 *                      Any error is logged with the correlation id and a masked
 *                      address. Nothing here can reach the caller.
 *
 * The correlation id is the only thread between the two halves: it is on the
 * response as x-correlation-id and on every log line the after() work writes,
 * so support can find what happened to a request that, by design, said nothing.
 */

export const runtime = 'nodejs';
// Room for the deferred work (limits, directory, Better Auth's round trips, the
// nested Resend send) on platforms with short function defaults.
export const maxDuration = 30;

// Serialised once, so every path returns these exact bytes. Checklist 2.16.
const GENERIC_BODY = JSON.stringify({
    message: 'If that address is on the team list, a code is on its way.',
});

const generic = (id: string) =>
    new Response(GENERIC_BODY, {
        status: 200,
        headers: {
            ...GATE_RESPONSE_HEADERS,
            'content-type': 'application/json; charset=utf-8',
            'x-correlation-id': id,
        },
    });

/**
 * The email, or null for anything that is not a JSON object with a string
 * email. null is not an error: the answer is the same, and nothing is scheduled.
 * The content type is required to be JSON so a cross-site form post, which can
 * only declare text/plain, is malformed by definition.
 */
async function readEmail(request: Request): Promise<string | null> {
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return null;
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null) return null;
    const { email } = body as { email?: unknown };
    return typeof email === 'string' ? email : null;
}

type Decision = { id: string; email: string; ip: string };

/**
 * Steps 5 to 8. Runs after the response, so nothing in here, however long it
 * takes or however it fails, is observable to the caller. One catch for all of
 * it: the only outcome of an error is a log line.
 */
async function decideAndSend({ id, email, ip }: Decision): Promise<void> {
    const masked = maskEmail(email);
    try {
        // 5. The per-IP counter, before the directory: a probe counts.
        const ipLimit = await checkIpLimit(ip);
        if (!ipLimit.allowed) {
            console.warn('[gate] request-code: rate limited, nothing sent', { id, email: masked, reason: ipLimit.reason });
            return;
        }

        // 6. The directory. Not a member: nothing else is counted or sent.
        const member = await getMemberDirectory().lookup(email);
        if (!member || !member.active) {
            console.info('[gate] request-code: not a current member, nothing sent', { id, email: masked });
            return;
        }

        // 7. The per-address gap and hour counter, for a member only.
        const emailLimit = await checkEmailLimits(email);
        if (!emailLimit.allowed) {
            console.warn('[gate] request-code: rate limited, nothing sent', { id, email: masked, reason: emailLimit.reason });
            return;
        }

        // 8. Better Auth.
        const { auth } = await import('@/lib/auth');
        await auth.api.sendVerificationOTP({ body: { email, type: 'sign-in' } });
        console.info('[gate] request-code: passed to Better Auth', { id, email: masked });
    } catch (error) {
        console.error('[gate] request-code: failed after the response, nothing sent', {
            id,
            email: masked,
            ...describeError(error),
        });
    }
}

export async function POST(request: Request) {
    // 1. Env check, before anything else and never deferred.
    const missing = missingRequiredEnv();
    if (missing.length > 0) return serviceUnavailable(missing);

    const id = correlationId();

    // 2. Origin. Not from this site: 403, and nothing is scheduled.
    if (!isSameOrigin(request.headers)) {
        console.warn('[gate] request-code refused', { id, reason: 'CROSS_ORIGIN', ...describeOrigin(request.headers) });
        return forbidden(id);
    }

    // 3. Normalise. Nothing about the address is decided here.
    const raw = await readEmail(request);
    if (raw !== null) {
        const decision: Decision = { id, email: normalizeEmail(raw), ip: clientIp(request.headers) };
        after(() => decideAndSend(decision));
    }

    // 4. The answer, the same whoever asked.
    return generic(id);
}
