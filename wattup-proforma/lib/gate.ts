import type { Session } from '@/lib/auth';
import { getMemberDirectory, normalizeEmail } from '@/lib/member-directory';
import prisma from '@/lib/prisma';

/**
 * Headers on every response the gate produces, public or gated. Nothing it
 * returns may be held by a shared cache or indexed.
 */
export const GATE_RESPONSE_HEADERS = {
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow',
} as const;

/**
 * One id per request. It is logged next to the real reason and returned in
 * x-correlation-id, so support can find the log line for a generic response
 * without the response having said anything. ADR 0001 section 7.
 */
export function correlationId(): string {
    return crypto.randomUUID();
}

/**
 * Same-site absolute paths only, so the gate cannot be used as an open
 * redirect. '//host' is protocol-relative, and browsers read '/\host' the same
 * way. Anything else, including nothing at all, is the tool's front door.
 * Checklist 2.23. The producer (app/tool) and the consumer (verify-code, and
 * later the login page) share this one definition.
 */
export function safeNext(raw: string | null | undefined): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
        return '/tool/';
    }
    return raw;
}

/**
 * The 503 for a missing required variable (lib/env.ts, checklist 2.9). Plain
 * text, naming the variables: a misconfigured deployment must fail visibly,
 * and this response is built from nothing that could itself be misconfigured.
 */
export function serviceUnavailable(missing: string[]): Response {
    return new Response(
        `Service unavailable: missing required environment variable(s): ${missing.join(', ')}\n`,
        {
            status: 503,
            headers: { ...GATE_RESPONSE_HEADERS, 'content-type': 'text/plain; charset=utf-8' },
        },
    );
}

/**
 * The loggable shape of a failure. Better Auth throws better-call APIErrors,
 * which carry a status name and a body with a code such as INVALID_OTP; those
 * are the fields worth keeping. Duck-typed rather than instanceof, so this file
 * does not have to import better-auth to describe its errors. Nothing here can
 * contain a submitted code: the routes only ever pass strings to Better Auth,
 * so its validation never echoes a value, and its own messages are fixed text.
 */
export function describeError(error: unknown): { name: string; status?: string; code?: string; message: string } {
    if (error instanceof Error) {
        const { status, body } = error as Error & { status?: unknown; body?: { code?: unknown } };
        return {
            name: error.name,
            ...(typeof status === 'string' ? { status } : {}),
            ...(typeof body?.code === 'string' ? { code: body.code } : {}),
            message: error.message,
        };
    }
    return { name: 'unknown', message: String(error) };
}

/**
 * The ONLY place a gated request decides membership.
 *
 * Every route that serves gated content calls this and nothing else. The
 * answer is a session for a CURRENT MEMBER, or null, and a caller never learns
 * why it was null. Three checks, cheapest first, each a refusal on its own:
 *
 *   1. A session, read from the database. lib/auth.ts enables cookieCache for
 *      cheap rendering, so a plain getSession can answer from the signed cookie
 *      for up to five minutes with no database access at all, and a user
 *      deleted or banned in that window keeps a five minute tail.
 *      disableCookieCache is Better Auth's own switch for this: the getSession
 *      query schema in dist/api/routes/session.d.mts, honoured in
 *      dist/api/routes/session.mjs.
 *
 *   2. The user row, not banned. When the dashboard bans someone its admin
 *      plugin clears the dashboard's own `session` table, never this app's
 *      `proforma_session`, and this app loads no admin plugin, so getSession
 *      never looks at `banned`. Without this check a banned user keeps
 *      pro-forma access for the full session TTL. ADR 0001 section 5 promises
 *      immediate revocation; this is where that promise is kept. The database
 *      directory in step 3 also excludes banned users, but this check is one
 *      indexed read, independent of which directory answers, and it also covers
 *      the env-list path, so it stays.
 *
 *   3. The member directory (lib/member-directory.ts, ADR 0001 sections 8 and
 *      18): a current, active member for the normalised address on the session.
 *      This is what resolves ACCESS_PROFORMA. Which directory answers is an
 *      environment decision, PROFORMA_ALLOWLIST in development and the
 *      `proforma_member` view in production. Phase 4b creates that view and
 *      changes nothing here; until then the database directory answers "no
 *      member" to everyone. A session issued to someone whose access has since
 *      been revoked fails here on the next request, with no redeploy.
 *
 * Nothing is caught here. A caller treats a throw the same as null: no
 * membership, never membership.
 *
 * `auth` is resolved here rather than imported at the top: lib/auth.ts throws
 * at load when BETTER_AUTH_SECRET is missing, and the gate routes import this
 * module before they have had the chance to answer 503 for exactly that
 * (lib/env.ts). The membership logic itself is unchanged by that.
 */
export async function requireMember(headers: Headers): Promise<Session | null> {
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession({
        headers,
        query: { disableCookieCache: true },
    });
    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { banned: true },
    });
    if (!user || user.banned === true) return null;

    const member = await getMemberDirectory().lookup(normalizeEmail(session.user.email));
    if (!member || !member.active) return null;

    return session;
}
