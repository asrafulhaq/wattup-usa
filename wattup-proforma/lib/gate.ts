import { auth, type Session } from '@/lib/auth';
import { getMemberDirectory, normalizeEmail } from '@/lib/member-directory';
import prisma from '@/lib/prisma';

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

    const member = await getMemberDirectory().lookup(normalizeEmail(session.user.email));
    if (!member || !member.active) return null;

    return session;
}
