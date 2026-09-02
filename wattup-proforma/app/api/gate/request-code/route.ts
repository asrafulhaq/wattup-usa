import { maskEmail } from '@/lib/email';
import { missingRequiredEnv } from '@/lib/env';
import { correlationId, describeError, GATE_RESPONSE_HEADERS, serviceUnavailable } from '@/lib/gate';
import { getMemberDirectory, normalizeEmail } from '@/lib/member-directory';
import { checkRequestLimits, clientIp } from '@/lib/rate-limit';

/**
 * POST /api/gate/request-code        body: { email }
 *
 * The first half of the gate, and the reason Better Auth's own OTP endpoints
 * are closed in app/api/auth/[...all]: those leak whether an address belongs to
 * a user, and this route exists so nothing does. ADR 0001 section 7.
 *
 * Every request, whatever it carries, gets the same answer: 200 and one fixed
 * body. The only thing that varies is what happens before it, and none of that
 * is observable from outside. In order, and the order matters:
 *
 *   1. normalise    trim + lowercase. A body that is not JSON, or an email that
 *                   is not a string, skips straight to the answer.
 *   2. rate limits  lib/rate-limit.ts, a phase 5 stub today. A breach sends
 *                   nothing and says nothing.
 *   3. directory    lib/member-directory.ts. Not a current, active member:
 *                   nothing is sent. Better Auth is never told the address.
 *   4. Better Auth  auth.api.sendVerificationOTP, server side. It stores the
 *                   hashed code and calls the lib/auth.ts callback, which
 *                   schedules the email with after() and returns at once, so the
 *                   Resend round trip never sits on the response path. Any error
 *                   is logged with a correlation id and a masked address, and the
 *                   caller still gets the same answer.
 *   5. answer       the generic 200, same bytes on every path.
 *
 * What a member's path costs beyond a non-member's is one verification insert
 * and one user lookup, low single-digit milliseconds against an in-region
 * database: the envelope ADR 0001 section 7 accepts. The mail, which is the
 * part measured in hundreds of milliseconds, happens after the response.
 *
 * Before any of it: lib/env.ts. A missing required variable is a 503 naming it
 * (checklist 2.9). `auth` is imported only after that check, because lib/auth.ts
 * throws at load when BETTER_AUTH_SECRET is missing and a 500 would hide the 503.
 */

export const runtime = 'nodejs';

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
 * email. null is not an error: it takes the generic path like everything else.
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

export async function POST(request: Request) {
    const missing = missingRequiredEnv();
    if (missing.length > 0) return serviceUnavailable(missing);

    const id = correlationId();

    // 1. Normalise.
    const raw = await readEmail(request);
    if (raw === null) return generic(id);
    const email = normalizeEmail(raw);

    // 2. Rate limits.
    const limit = await checkRequestLimits({ email, ip: clientIp(request.headers) });
    if (!limit.allowed) {
        console.warn('[gate] request-code: rate limited, nothing sent', {
            id,
            email: maskEmail(email),
            reason: limit.reason,
        });
        return generic(id);
    }

    // 3. Directory. A lookup that throws is no member: fail closed.
    const member = await getMemberDirectory()
        .lookup(email)
        .catch((error: unknown) => {
            console.error('[gate] request-code: directory lookup failed, nothing sent', {
                id,
                email: maskEmail(email),
                ...describeError(error),
            });
            return null;
        });
    if (!member || !member.active) return generic(id);

    // 4. Better Auth. Stores the hashed code and schedules the email.
    try {
        const { auth } = await import('@/lib/auth');
        await auth.api.sendVerificationOTP({ body: { email, type: 'sign-in' } });
    } catch (error) {
        console.error('[gate] request-code: send failed', {
            id,
            email: maskEmail(email),
            ...describeError(error),
        });
    }

    // 5. The answer.
    return generic(id);
}
