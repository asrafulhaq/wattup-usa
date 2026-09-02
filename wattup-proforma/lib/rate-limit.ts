/**
 * Rate limits for the gate routes. A STUB: phase 5 builds the real thing.
 *
 * Checklist 5.1 to 5.7 (ADR 0001 section 10) specify per-address and per-IP
 * limits on request-code, the 60 second gap between codes for one address, a
 * per-address cap on verify attempts beyond Better Auth's own allowedAttempts,
 * and where the counters live, which is the Upstash question in ADR section 15.
 * None of that exists yet. What exists is the call site, so request-code
 * already runs its checks in the order ADR section 7 fixes, all of them after
 * the response has gone out:
 *
 *   normalise -> generic response -> after(): rate limit -> directory -> Better Auth
 *
 * On `allowed: false` nothing is sent, exactly as for a non-member. A caller
 * has already received the generic response and never learns which of the two
 * it was.
 */

export type RequestLimitInput = {
    /** Normalised address (lib/member-directory.ts normalizeEmail). */
    email: string;
    /** Best-effort client address, or null when no proxy header was present. */
    ip: string | null;
};

export type RequestLimitResult = { allowed: true } | { allowed: false; reason: string };

export async function checkRequestLimits(input: RequestLimitInput): Promise<RequestLimitResult> {
    // Phase 5. Until then every request is allowed. The input is accepted now so
    // the call site does not change when the implementation arrives.
    void input;
    return { allowed: true };
}

/**
 * The client address as the platform reports it: the first x-forwarded-for
 * entry, then x-real-ip, else null. Which header to trust, and whether to trust
 * it at all, is a phase 5 decision (ADR 0001 section 10); nothing here makes an
 * allow or refuse decision on it.
 */
export function clientIp(headers: Headers): string | null {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const real = headers.get('x-real-ip')?.trim();
    return real || null;
}
