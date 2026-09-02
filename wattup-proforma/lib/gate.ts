import { auth, type Session } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * The ONLY place a gated request decides membership.
 *
 * Every route that serves gated content calls this and nothing else. It does
 * two things that a plain auth.api.getSession does not:
 *
 *   1. It forces a database read. lib/auth.ts enables cookieCache for cheap
 *      rendering, so a plain getSession can answer from the signed cookie for
 *      up to five minutes with no database access at all, and a user deleted
 *      or banned in that window keeps a five minute tail. disableCookieCache is
 *      Better Auth's own switch for this: the getSession query schema in
 *      dist/api/routes/session.d.mts, honoured in dist/api/routes/session.mjs.
 *
 *   2. It re-reads the user row and refuses a banned or vanished user. When the
 *      dashboard bans someone its admin plugin clears the dashboard's own
 *      `session` table, never this app's `proforma_session`, and this app loads
 *      no admin plugin, so getSession never looks at `banned`. Without this
 *      check a banned user keeps pro-forma access for the full session TTL.
 *      ADR 0001 section 5 promises immediate revocation; this is where that
 *      promise is kept.
 *
 * Phase 2 replaces step 2 with the MemberDirectory lookup against the
 * proforma_member view (ADR 0001 section 18), so ACCESS_PROFORMA is resolved by
 * the view wattup-frontend owns. The contract stays the same: a session for a
 * current member, or null. Callers never learn why it was null.
 */
export async function requireMember(headers: Headers): Promise<Session | null> {
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

    return session;
}
