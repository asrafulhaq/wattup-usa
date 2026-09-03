import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
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
 * What the whole log can be narrowed to on the site-wide page. Every filter is optional
 * and they combine, so "pro-forma sign-in failures" is one query rather than a scroll.
 */
export interface ActivityFilter {
    /** 'dashboard' or 'proforma'. Anything else matches nothing rather than everything. */
    app?: string;
    /** One exact event name, as stored. */
    event?: string;
    /** Substring of the address the row is about, case insensitive. */
    email?: string;
}

/** The where clause for the site-wide page: no user, just the filters that were given. */
export function siteWideWhere(filter: ActivityFilter = {}): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = {};
    if (filter.app) where.app = filter.app;
    if (filter.event) where.event = filter.event;
    if (filter.email) where.email = { contains: filter.email, mode: 'insensitive' };
    return where;
}

/**
 * The pure read, over an injected client. Offset paging, newest first, matching the
 * page/pageSize shape the articles and users lists already use.
 *
 * `userId` narrows to one person; omitting it reads the whole log, which is what the
 * site-wide page does. `scope` still applies either way, so the sign-in view works on
 * both.
 */
export async function readActivity(
    db: ActivitySource,
    options: {
        userId?: string;
        scope: ActivityScope;
        page?: number;
        pageSize?: number;
        filter?: ActivityFilter;
    }
): Promise<ActivityPage> {
    const pageSize = options.pageSize ?? ACTIVITY_PAGE_SIZE;
    const page = Number.isFinite(options.page) ? Math.max(1, Math.floor(options.page ?? 1)) : 1;
    const scoped = options.userId
        ? whereForScope(options.userId, options.scope)
        : options.scope === 'signin'
          ? { event: { in: [...SIGNIN_EVENTS] } }
          : {};
    // Composed only when there is something to compose. An unfiltered read, which is
    // every read the per-person page makes, keeps exactly the where it always had rather
    // than gaining an AND wrapper around one clause.
    const extra = siteWideWhere(options.filter);
    const where: Prisma.ActivityLogWhereInput =
        Object.keys(extra).length === 0 ? scoped : { AND: [scoped, extra] };

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

export { ACTIVITY_TAG } from '@/lib/cache-tags';
import { ACTIVITY_TAG } from '@/lib/cache-tags';

/**
 * How long a page of the log may be reused.
 *
 * The log was uncached because the pro-forma app writes to it and cannot invalidate this
 * app's cache. That reasoning holds, and it cost 1.8 seconds on every filter change,
 * because each one is two queries to a database several hundred milliseconds away. The
 * compromise: a short window, plus `logActivity` invalidating the tag for everything the
 * dashboard itself writes. So a dashboard event appears at once, a pro-forma event
 * within the window, and browsing back to a filter already seen is instant.
 */
const ACTIVITY_CACHE = { stale: 15, revalidate: 30, expire: 300 } as const;

/**
 * One page of the WHOLE log, for a caller holding VIEW_ACTIVITY_LOG (the dashboard's
 * Activity page). Same reader and same shape as the per-person view; only the absence
 * of a user id differs.
 *
 * Deliberately uncached, like the per-user read below. An audit table that lags is worse
 * than one that costs a query: the reason to open it is usually that something just
 * happened.
 */
async function readSiteActivity(
    scope: ActivityScope,
    page: number,
    app: string,
    event: string,
    email: string
): Promise<ActivityPage> {
    'use cache';
    cacheTag(ACTIVITY_TAG);
    cacheLife(ACTIVITY_CACHE);
    // Primitive arguments rather than an object, because the cache key is built from
    // them and two objects with the same contents are not the same key.
    try {
        return await readActivity(prisma, {
            scope,
            page,
            filter: { app: app || undefined, event: event || undefined, email: email || undefined },
        });
    } catch (error) {
        console.error('[activity] failed to read activity_log', error);
        return EMPTY_ACTIVITY_PAGE;
    }
}

export async function getSiteActivity(options: {
    scope: ActivityScope;
    page?: number;
    pageSize?: number;
    filter?: ActivityFilter;
}): Promise<ActivityPage> {
    const authorised = await requirePermission(Permission.VIEW_ACTIVITY_LOG);
    if (!authorised) return EMPTY_ACTIVITY_PAGE;

    return readSiteActivity(
        options.scope,
        options.page ?? 1,
        options.filter?.app ?? '',
        options.filter?.event ?? '',
        options.filter?.email ?? ''
    );
}

/**
 * The distinct app and event names actually present, so the filters offer what exists
 * rather than a hardcoded list that drifts as either application adds an event.
 */
async function readActivityFacets(): Promise<{ apps: string[]; events: string[] }> {
    'use cache';
    cacheTag(ACTIVITY_TAG);
    cacheLife(ACTIVITY_CACHE);
    try {
        const [apps, events] = await Promise.all([
            prisma.activityLog.findMany({ distinct: ['app'], select: { app: true }, orderBy: { app: 'asc' } }),
            prisma.activityLog.findMany({ distinct: ['event'], select: { event: true }, orderBy: { event: 'asc' } }),
        ]);
        return { apps: apps.map(a => a.app), events: events.map(e => e.event) };
    } catch (error) {
        console.error('[activity] failed to read facets', error);
        return { apps: [], events: [] };
    }
}

export async function getActivityFacets(): Promise<{ apps: string[]; events: string[] }> {
    const authorised = await requirePermission(Permission.VIEW_ACTIVITY_LOG);
    if (!authorised) return { apps: [], events: [] };
    return readActivityFacets();
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
