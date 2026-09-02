import 'server-only';

import prisma from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

/**
 * The dashboard's writer for activity_log (ADR 0001 section 9; checklist 4a.23, 4b.6).
 *
 * One row per auditable event. `email` and `userId` name the SUBJECT, the user the
 * event happened to; `actorEmail` and `actorUserId` name who did it. The email goes in
 * whole, on purpose: the page that reads this table has to be readable (4b.7). Every
 * other log line in this app masks it, including the one this module writes when the
 * insert itself fails.
 *
 * logActivity never throws. An audit row that cannot be written is reported and the
 * action that caused it still completes: the change has already happened by the time
 * this runs, and failing the caller would not undo it.
 */

export const ACTIVITY_APP = 'dashboard';

export type ActivityEvent =
    | 'permission.granted'
    | 'permission.revoked'
    | 'role.changed'
    | 'role_permission.changed'
    | 'user.banned'
    | 'user.unbanned'
    | 'user.created'
    | 'user.deleted'
    | 'settings.updated'
    // The dashboard's own sign-ins (checklist 4b.6), written from lib/auth.ts. The
    // pro-forma app writes the same two event names with app = 'proforma'.
    | 'signin.success'
    | 'signin.failed';

export interface ActivityEntry {
    event: ActivityEvent;
    /** Who the event happened to. `id` is null for an address with no account. */
    target: { id?: string | null; email: string };
    /** Who did it. Null for an event with no signed-in actor. */
    actor?: { id: string; email: string } | null;
    meta?: Prisma.InputJsonValue;
    correlationId?: string | null;
}

/** "john.doe@example.com" becomes "j***@example.com". Application logs never carry a whole address. */
export function maskEmail(email: unknown): string {
    if (typeof email !== 'string') return '(no email)';
    const at = email.indexOf('@');
    if (at <= 0) return '***';
    return `${email[0]}***${email.slice(at)}`;
}

export interface RequestContext {
    ipAddress: string | null;
    userAgent: string | null;
}

/**
 * The address and user agent carried by one set of request headers. Split out from
 * requestContext so a caller that already holds the headers, such as the Better Auth
 * sign-in hook in lib/auth.ts, reads them the same way rather than parsing
 * x-forwarded-for a second time with its own rules.
 */
export function contextFromHeaders(h: Pick<Headers, 'get'>): RequestContext {
    const forwarded = h.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : h.get('x-real-ip');
    return {
        ipAddress: ipAddress || null,
        userAgent: h.get('user-agent') || null,
    };
}

/**
 * The client address and user agent of the current request, when there is one. Outside
 * a request scope (a script, a test) headers() throws, and that is simply "unknown".
 */
export async function requestContext(): Promise<RequestContext> {
    try {
        return contextFromHeaders(await headers());
    } catch {
        return { ipAddress: null, userAgent: null };
    }
}

export type ActivitySink = Pick<PrismaClient, 'activityLog'>;

/** The row an entry becomes. Exported so a test can assert the exact shape written. */
export function toActivityRow(
    entry: ActivityEntry,
    context: RequestContext
): Prisma.ActivityLogUncheckedCreateInput {
    return {
        app: ACTIVITY_APP,
        event: entry.event,
        email: entry.target.email,
        userId: entry.target.id ?? null,
        actorUserId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: entry.correlationId ?? null,
        meta: entry.meta,
    };
}

/** The pure write, over an injected client. logActivity below is this over the singleton. */
export async function writeActivity(
    db: ActivitySink,
    entry: ActivityEntry,
    context: RequestContext
): Promise<void> {
    try {
        await db.activityLog.create({ data: toActivityRow(entry, context) });
    } catch (error) {
        console.error(
            `[activity-log] failed to write ${entry.event} for ${maskEmail(entry.target.email)}` +
                (entry.actor ? ` by ${maskEmail(entry.actor.email)}` : ''),
            error
        );
    }
}

/**
 * Records one event. Never throws; see the module comment.
 *
 * `context` is optional and exists for one caller: Better Auth's sign-in hook already
 * holds the request's headers and runs where next/headers() is not guaranteed to be in
 * scope, so it passes what it has rather than losing the address and user agent of the
 * very requests this event is worth recording for.
 */
export async function logActivity(entry: ActivityEntry, context?: RequestContext): Promise<void> {
    await writeActivity(prisma, entry, context ?? (await requestContext()));
}
