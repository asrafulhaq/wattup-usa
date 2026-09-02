
import prisma from '@/lib/prisma';
import { isMissingTable } from '@/lib/rate-limit';

/**
 * Who may open the Site Pro-Forma Builder. ADR 0001 sections 8 and 18.
 *
 * One interface, two implementations, chosen by environment:
 *
 *   EnvMemberDirectory   PROFORMA_ALLOWLIST, a comma-separated list of addresses.
 *                        Local development only. In production it is ignored
 *                        even when set: see getMemberDirectory (checklist 4b.4).
 *   DbMemberDirectory    the `proforma_member` SQL view that wattup-frontend
 *                        owns, which resolves ACCESS_PROFORMA in SQL so this app
 *                        never reimplements permission resolution. Production.
 *
 * A caller gets a Member or null and never learns why it was null. lib/gate.ts
 * consults this on every gated request; the phase 2 gate routes consult it at
 * request-code and again at verify-code.
 */

export type Member = { id: string; email: string; name: string; active: boolean };

export interface MemberDirectory {
    lookup(email: string): Promise<Member | null>;
}

/**
 * The ONE place an address is normalised: trim, then lowercase. Checklist 2.12
 * asks for this on every path, and every path gets it by calling this. Both
 * directories also normalise what they are handed, so a caller that forgets is
 * still safe; the caller should still not forget.
 */
export function normalizeEmail(raw: string): string {
    return raw.trim().toLowerCase();
}

/**
 * PROFORMA_ALLOWLIST=" Alice@Example.com ,bob@x.io" is two members. Entries are
 * normalised once, at construction, so a lookup is a set test between two
 * normalised sides. A hit is synthesised from the address alone: an env var
 * carries no id and no name, and nothing downstream needs more than "yes".
 */
export class EnvMemberDirectory implements MemberDirectory {
    private readonly members: ReadonlySet<string>;

    constructor(raw: string | undefined = process.env.PROFORMA_ALLOWLIST) {
        this.members = new Set(
            (raw ?? '')
                .split(',')
                .map(normalizeEmail)
                .filter((entry) => entry.length > 0),
        );
    }

    async lookup(email: string): Promise<Member | null> {
        const normalised = normalizeEmail(email);
        if (!this.members.has(normalised)) return null;
        return { id: normalised, email: normalised, name: normalised, active: true };
    }
}

// Set once the missing view has been reported, so the pre-4b state costs one log
// line per process rather than one per request.
let missingViewReported = false;

/**
 *   SELECT id, email, name, active FROM proforma_member WHERE email = $1
 *
 * The view is the single definition of who may sign in, owned by the app that
 * owns the schema (ADR 0001 section 18). Revoking ACCESS_PROFORMA or banning a
 * user changes what it returns on the very next request, with no redeploy.
 *
 * THE VIEW DOES NOT EXIST YET. wattup-frontend creates it in the phase 4b
 * migration (checklist 4b.2), and this app never migrates, so nothing here can
 * create it. Until then every query fails with Prisma's P2021 (relation does
 * not exist). That is treated as "no member": fail closed, reported once so
 * the cause is findable, never thrown to a caller who would then have to
 * guess whether to allow or refuse. Any other database error is also "no
 * member", and is logged every time, because after 4b it is a real fault.
 *
 * The comparison is exact against the normalised address, so the view must
 * emit a lowercased `email` column (ADR section 18 writes `lower(email)`);
 * that is a 4b concern, noted here so it is not lost.
 */
export class DbMemberDirectory implements MemberDirectory {
    async lookup(email: string): Promise<Member | null> {
        const normalised = normalizeEmail(email);
        try {
            const row = await prisma.proformaMember.findUnique({
                where: { email: normalised },
                select: { id: true, email: true, name: true, active: true },
            });
            return row ?? null;
        } catch (error) {
            // P2021 from typed queries, P2010 + TableDoesNotExist/42P01 through the pg
            // driver adapter: both mean "not migrated yet", and both report once.
            const missingView = isMissingTable(error);
            if (!missingView || !missingViewReported) {
                missingViewReported ||= missingView;
                console.error(
                    '[member-directory] proforma_member lookup failed; treating as no member. ' +
                        'The proforma_member view is created by the wattup-frontend phase 4b ' +
                        'migration (checklist 4b.2) and does not exist until then.',
                    error,
                );
            }
            return null;
        }
    }
}

let directory: MemberDirectory | undefined;

/**
 * Env when PROFORMA_ALLOWLIST is set (non-blank) and this is not production;
 * otherwise Db.
 *
 * In production the env list is IGNORED even when set. An allowlist in an env
 * var would bypass the database, and with it every revocation an admin makes in
 * the dashboard, so production always answers from the view (checklist 4b.4).
 * A set variable there is a misconfiguration: it is shouted about, then not
 * used. Fail closed, never open.
 *
 * Chosen once per process. The environment does not change at runtime, and
 * choosing once keeps the warning to a line rather than one per request.
 */
export function getMemberDirectory(): MemberDirectory {
    if (directory) return directory;

    const allowlist = process.env.PROFORMA_ALLOWLIST?.trim();
    const production = process.env.NODE_ENV === 'production';

    if (allowlist && !production) {
        directory = new EnvMemberDirectory(allowlist);
        return directory;
    }

    if (allowlist) {
        console.warn(
            '[member-directory] PROFORMA_ALLOWLIST is set in production and is being IGNORED. ' +
                'Production membership always comes from the proforma_member view; the env ' +
                'list must never bypass the database (checklist 4b.4). Unset it.',
        );
    }
    directory = new DbMemberDirectory();
    return directory;
}
