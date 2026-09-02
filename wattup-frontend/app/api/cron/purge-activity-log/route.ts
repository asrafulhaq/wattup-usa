import { createHash, timingSafeEqual } from 'node:crypto';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

/**
 * The scheduled purge of activity_log. ADR 0001 section 9, checklist 4b.8.
 *
 * Vercel Cron calls this path once a day (vercel.json) with
 * `Authorization: Bearer ${CRON_SECRET}`, and nothing else may call it: any
 * other request, or any request while CRON_SECRET is unset, is answered 401
 * with an empty body. The comparison is constant time over a digest of both
 * sides, so neither the secret's length nor a matching prefix can be measured.
 *
 * Rows older than ACTIVITY_LOG_RETENTION_DAYS (default 90; the client has not
 * confirmed the number, open question F) are deleted in one parameterised
 * statement. Raw SQL, deliberately: the table is created by the phase 4b
 * migration on another branch, so this file must not depend on a Prisma model
 * that this branch's schema does not declare. Until that migration is applied
 * the DELETE fails with "relation does not exist"; that is answered 200 with
 * `skipped` and reported once per process, so a cron run before the migration
 * is a log line and not a failed job.
 *
 * This runs on the Node runtime, which node:crypto and the Prisma driver
 * adapter both need. That is the default for a route handler, and it is not
 * declared: next.config.ts enables cacheComponents, and Next 16 refuses the
 * `runtime` segment export under it ("Route segment config "runtime" is not
 * compatible with `nextConfig.cacheComponents`"). Nothing here may move to
 * the edge runtime.
 */

const DEFAULT_RETENTION_DAYS = 90;

const NO_STORE = { 'cache-control': 'no-store' };

/**
 * ACTIVITY_LOG_RETENTION_DAYS as a whole number of days, 1 or more; the
 * default when unset or blank; null when set to anything else, so a typo can
 * never become "delete everything".
 */
function readRetentionDays(): number | null {
    const raw = process.env.ACTIVITY_LOG_RETENTION_DAYS?.trim();
    if (!raw) return DEFAULT_RETENTION_DAYS;
    if (!/^\d+$/.test(raw)) return null;
    const days = Number(raw);
    return days >= 1 ? days : null;
}

/**
 * True only for `Bearer ${CRON_SECRET}`, byte for byte. Both sides are hashed
 * before timingSafeEqual so the comparison takes the same time whatever the
 * presented header's length; a plain length check would leak the secret's.
 */
function isAuthorised(header: string | null): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret || header === null) return false;
    const expected = createHash('sha256').update(`Bearer ${secret}`).digest();
    const presented = createHash('sha256').update(header).digest();
    return timingSafeEqual(expected, presented);
}

/**
 * Copied from wattup-proforma/lib/rate-limit.ts isMissingTable; the apps share
 * no code (root CLAUDE.md), so keep the two in step by hand. P2021 from the
 * typed client; P2010 wrapping a driver-adapter cause of kind
 * TableDoesNotExist (SQLSTATE 42P01) from $executeRaw.
 */
function isMissingTable(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    if (error.code === 'P2021') return true;
    if (error.code !== 'P2010') return false;
    const cause = (error.meta as { driverAdapterError?: { cause?: { kind?: unknown; originalCode?: unknown } } } | undefined)
        ?.driverAdapterError?.cause;
    return cause?.kind === 'TableDoesNotExist' || cause?.originalCode === '42P01';
}

// Set once the missing table has been reported, so the pre-4b state costs one
// log line per process rather than one per run.
let missingTableReported = false;

export async function GET(request: Request) {
    if (!isAuthorised(request.headers.get('authorization'))) {
        return new Response(null, { status: 401, headers: NO_STORE });
    }

    const retentionDays = readRetentionDays();
    if (retentionDays === null) {
        console.error('[purge-activity-log] ACTIVITY_LOG_RETENTION_DAYS must be a whole number of days, 1 or more; nothing deleted');
        return NextResponse.json({ error: 'ACTIVITY_LOG_RETENTION_DAYS is not a whole number of days' }, { status: 500, headers: NO_STORE });
    }

    try {
        // $1 is the retention as an integer; the interval is built in SQL from it.
        const deleted = await prisma.$executeRaw`DELETE FROM "activity_log" WHERE "createdAt" < now() - make_interval(days => ${retentionDays}::int)`;
        return NextResponse.json({ deleted, retentionDays }, { headers: NO_STORE });
    } catch (error) {
        if (isMissingTable(error)) {
            if (!missingTableReported) {
                missingTableReported = true;
                console.warn(
                    '[purge-activity-log] activity_log does not exist yet; nothing to purge until the phase 4b migration ' +
                        '(checklist 4b.1) is applied. Reported once per process.',
                );
            }
            return NextResponse.json({ deleted: 0, skipped: 'table missing' }, { headers: NO_STORE });
        }
        console.error('[purge-activity-log] purge failed', {
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: 'purge failed' }, { status: 500, headers: NO_STORE });
    }
}
