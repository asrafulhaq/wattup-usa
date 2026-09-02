import type { Prisma } from '@prisma/client';

import { maskEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { clientIp, isMissingTable } from '@/lib/rate-limit';

/**
 * The audit trail: one row in activity_log per decision the gate makes.
 * ADR 0001 section 9, checklist 4b.5 and 4b.7.
 *
 * wattup-frontend owns the table and renders it; this app only inserts, and
 * only these four events:
 *
 *   code.requested   request-code passed a member's address to Better Auth
 *   code.refused     request-code sent nothing, meta.reason says why
 *   signin.success   verify-code issued a session to a current member
 *   signin.failed    verify-code refused, meta.reason says why
 *
 * TWO RULES, BOTH FROM THE ADR AND AGENTS.md
 *
 *   1. The row holds the FULL address. The dashboard must be able to show a
 *      person's sign-in history, and a hashed column cannot be searched by a
 *      human. The masking rule applies to application logs, which are read by
 *      developers and shipped to third parties: every log line THIS module
 *      writes carries maskEmail(email), never the address.
 *
 *   2. A write never runs on the response path, and never throws. Both gate
 *      routes call logActivity from inside after(), once the response has
 *      gone out, so the insert's latency and its failure are invisible to the
 *      caller: a member and a non-member must get identical bytes in identical
 *      time, and a database round trip on the response path would break both.
 *      logActivity catches everything, because a lost audit row is a log line
 *      and a thrown one would be an unhandled rejection inside after().
 *
 * THE TABLE DOES NOT EXIST YET. It arrives with the wattup-frontend phase 4b
 * migration (checklist 4b.1), and this app never migrates. Until then every
 * insert fails with P2021 (relation does not exist); that is reported once per
 * process, the same way lib/member-directory.ts reports the missing view, and
 * swallowed. Any other failure is reported every time, because after 4b it is
 * a real fault.
 */

export type ActivityEvent =
    | 'code.requested'
    | 'code.refused'
    | 'signin.success'
    | 'signin.failed'
    /** A member imported an EVpin report through app/api/tool/evpin-fetch (checklist 5.15). */
    | 'tool.evpin_fetch';

/** Why request-code sent nothing. The names are the branches of decideAndSend, in order. */
export type CodeRefusedReason = 'rate_limited_ip' | 'not_member' | 'banned' | 'rate_limited_email' | 'send_failed';

/**
 * Why verify-code refused. The first four are Better Auth's own codes
 * (INVALID_OTP, OTP_EXPIRED, TOO_MANY_ATTEMPTS, USER_NOT_FOUND) renamed; the
 * rest are this app's checks around it. 'unknown' is any other throw.
 */
export type SignInFailedReason =
    | 'rate_limited_ip'
    | 'invalid_code'
    | 'expired'
    | 'attempts_exhausted'
    | 'not_member'
    | 'banned'
    | 'unknown';

/**
 * The per-request fields every row carries, read once from the request on the
 * response path (they are cheap header reads, not decisions) and handed to
 * every logActivity call that request schedules.
 */
export type ActivityContext = {
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string;
};

export type ActivityEntry = ActivityContext & {
    event: ActivityEvent;
    /** The subject's address, normalised (lib/member-directory.ts normalizeEmail). Stored in full. */
    email: string;
    /** The subject's user id, when the event has established one. */
    userId?: string | null;
    meta?: Prisma.InputJsonObject;
};

/** Longer than any real user agent; enough to keep a hostile header from bloating a row. */
export const USER_AGENT_MAX_LENGTH = 512;

/**
 * The User-Agent header, cut at USER_AGENT_MAX_LENGTH characters, or null when
 * the request carried none. Never throws.
 */
export function clientUserAgent(headers: Headers): string | null {
    const raw = headers.get('user-agent')?.trim();
    if (!raw) return null;
    return raw.length > USER_AGENT_MAX_LENGTH ? raw.slice(0, USER_AGENT_MAX_LENGTH) : raw;
}

/**
 * The three per-request fields from the request headers and the correlation
 * id the route minted. clientIp is the same function the rate limiter keys
 * on, so the address in the log is the address that was counted.
 */
export function activityContext(headers: Headers, correlationId: string): ActivityContext {
    return {
        ipAddress: clientIp(headers),
        userAgent: clientUserAgent(headers),
        correlationId,
    };
}

// Set once the missing table has been reported, so the pre-4b state costs one
// log line per process rather than one per request.
let missingTableReported = false;

/**
 * One INSERT into activity_log, app 'proforma'. Optional fields are written as
 * explicit nulls so a row's shape does not depend on which caller wrote it.
 * Resolves whatever happens; see the header for why.
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
    const { event, email, userId, ipAddress, userAgent, correlationId, meta } = entry;
    try {
        await prisma.activityLog.create({
            data: {
                app: 'proforma',
                event,
                email,
                userId: userId ?? null,
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? null,
                correlationId,
                ...(meta === undefined ? {} : { meta }),
            },
        });
    } catch (error) {
        const missingTable = isMissingTable(error);
        if (missingTable && missingTableReported) return;
        missingTableReported ||= missingTable;
        console.error(
            '[activity-log] write failed; the event is lost' +
                (missingTable
                    ? '. The activity_log table is created by the wattup-frontend phase 4b ' +
                      'migration (checklist 4b.1) and does not exist until then; reported once.'
                    : ''),
            {
                event,
                email: maskEmail(email),
                correlationId,
                message: error instanceof Error ? error.message : String(error),
            },
        );
    }
}
