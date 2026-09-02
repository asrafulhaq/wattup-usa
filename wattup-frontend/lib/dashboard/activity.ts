import 'server-only';

import { requirePermission } from '@/lib/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * The activity_log reads behind the user detail page (checklist 4c.6, 4c.7; ADR 0001
 * section 9 and D14).
 *
 * A server-only module rather than a server action, like lib/dashboard/users.ts: the
 * uncached wrapper does the permission check, because that reads headers, and nothing
 * here is cached at all. An audit trail read from a cache is an audit trail that can
 * be one revalidation window out of date, which is the one thing it must never be.
 *
 * Both apps write to this table, so both apps' rows come back from one query. That is
 * the whole reason the two share a database (ADR 0001 D3).
 */

/** The slice of the client this needs, so a test can hand it a stub. */
export type ActivitySource = Pick<PrismaClient, 'activityLog'>;

/** Twenty a page, matching the other dashboard lists. */
export const ACTIVITY_PAGE_SIZE = 20;

/**
 * The sign-in events, dashboard and pro-forma between them. `signin.*` are the two
 * outcomes of verifying a code; `code.*` are the two outcomes of asking for one.
 */
export const SIGNIN_EVENTS = [
    'signin.success',
    'signin.failed',
    'code.requested',
    'code.refused',
] as const;

export type ActivityScope = 'all' | 'signin';

export interface ActivityRow {
    id: string;
    app: string;
    event: string;
    email: string;
    /** Null when this row records something the user did to somebody else. */
    userId: string | null;
    actorUserId: string | null;
    actorEmail: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    meta: Prisma.JsonValue | null;
    createdAt: Date;
}

export interface ActivityPage {
    rows: ActivityRow[];
    total: number;
    page: number;
    pageSize: number;
}

export const EMPTY_ACTIVITY_PAGE: ActivityPage = {
    rows: [],
    total: 0,
    page: 1,
    pageSize: ACTIVITY_PAGE_SIZE,
};

/**
 * One user's rows: the events that happened TO them, and the events they carried out
 * on somebody else. Both halves belong on their page, and only the pair of them makes
 * "what has this account been doing" answerable.
 *
 * Matched on the two foreign keys, not on the email. `activity_log.email` survives the
 * account it names (user.deleted writes a row with a null userId on purpose), so
 * matching the address as well would pull a predecessor's history onto a re-created
 * account with the same address. The cost is that a pro-forma `signin.failed` row,
 * which that app writes without a user id, does not appear here.
 */
export function activityWhere(userId: string): Prisma.ActivityLogWhereInput {
    return { OR: [{ userId }, { actorUserId: userId }] };
}

/** The same rows, narrowed to the sign-in and code events (checklist 4c.7). */
export function signInWhere(userId: string): Prisma.ActivityLogWhereInput {
    return { ...activityWhere(userId), event: { in: [...SIGNIN_EVENTS] } };
}

export function whereForScope(userId: string, scope: ActivityScope): Prisma.ActivityLogWhereInput {
    return scope === 'signin' ? signInWhere(userId) : activityWhere(userId);
}

/** Page numbers are 1 based and clamped, so a hand-edited page never skips backwards. */
export function offsetFor(page: number, pageSize: number): number {
    const safe = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    return (safe - 1) * pageSize;
}

const ACTIVITY_SELECT = {
    id: true,
    app: true,
    event: true,
    email: true,
    userId: true,
    actorUserId: true,
    actorEmail: true,
    ipAddress: true,
    userAgent: true,
    meta: true,
    createdAt: true,
} as const;

/**
 * The pure read, over an injected client. Offset paging, newest first, matching the
 * page/pageSize shape the articles and users lists already use.
 */
export async function readActivity(
    db: ActivitySource,
    options: { userId: string; scope: ActivityScope; page?: number; pageSize?: number }
): Promise<ActivityPage> {
    const pageSize = options.pageSize ?? ACTIVITY_PAGE_SIZE;
    const page = Number.isFinite(options.page) ? Math.max(1, Math.floor(options.page ?? 1)) : 1;
    const where = whereForScope(options.userId, options.scope);

    const [rows, total] = await Promise.all([
        db.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: offsetFor(page, pageSize),
            take: pageSize,
            select: ACTIVITY_SELECT,
        }),
        db.activityLog.count({ where }),
    ]);

    return { rows, total, page, pageSize };
}

/**
 * One page of a user's activity, for a caller holding VIEW_ACTIVITY_LOG.
 *
 * An empty page for anyone else, so the detail page can leave the section out rather
 * than render an error where a table should be. The section is hidden in that case
 * anyway; this is the half that holds if the markup ever forgets.
 */
export async function getUserActivity(options: {
    userId: string;
    scope: ActivityScope;
    page?: number;
    pageSize?: number;
}): Promise<ActivityPage> {
    const authorised = await requirePermission(Permission.VIEW_ACTIVITY_LOG);
    if (!authorised) return EMPTY_ACTIVITY_PAGE;

    try {
        return await readActivity(prisma, options);
    } catch (error) {
        // The table arrives with the phase 4b migration. Until then, and if the query
        // ever fails for any other reason, the page shows an empty section rather than
        // a 500 over an audit read.
        console.error('[activity] failed to read activity_log', error);
        return EMPTY_ACTIVITY_PAGE;
    }
}
