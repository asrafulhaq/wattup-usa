'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import {
    appBadgeClasses,
    appLabel,
    eventLabel,
    eventTone,
    orDash,
    summariseMeta,
} from '@/components/dashboard/users/detail/activity-format';
import type { ActivityRow } from '@/lib/dashboard/activity';

/**
 * The activity table's columns.
 *
 * A factory rather than a constant, because the same rows are shown in two places that
 * want different columns: the whole log, where every row belongs to somebody different
 * and Who matters, and one person's page, where Who would repeat their name on every
 * line. The sign-in view swaps the Detail column for the address and browser, which is
 * the only reason anyone opens it.
 */

const TONE: Record<'neutral' | 'good' | 'bad', string> = {
    neutral: 'bg-dash-canvas text-dark/70 border border-dash-border',
    good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    bad: 'bg-red-50 text-red-700 border border-red-200',
};

// A fixed format, not a relative one: an audit table is read to answer "when exactly",
// and "3 days ago" is the one thing it must not say.
const WHEN = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
});

export function makeActivityColumns(options: {
    /** Adds the Who column: the whole log, where each row is somebody different. */
    showWho?: boolean;
    /** Swaps Detail for the address and browser. */
    signIn?: boolean;
    /** On a person's page, tells a row they carried out from one that happened to them. */
    subjectId?: string;
}): ColumnDef<ActivityRow, unknown>[] {
    const columns: ColumnDef<ActivityRow, unknown>[] = [
        {
            id: 'when',
            header: 'When (UTC)',
            cell: ({ row }) => (
                <span className='whitespace-nowrap text-xs text-dark/60'>
                    {WHEN.format(row.original.createdAt)}
                </span>
            ),
        },
    ];

    if (options.showWho) {
        columns.push({
            id: 'who',
            header: 'Who',
            cell: ({ row }) => {
                const { userId, email, actorEmail } = row.original;
                return (
                    <div className='text-xs'>
                        {userId ? (
                            <Link
                                href={`/dashboard/users/${userId}`}
                                className='text-primary hover:underline'
                                // The row itself is not clickable here, so stop this from
                                // being swallowed if it ever becomes so.
                                onClick={event => event.stopPropagation()}
                            >
                                {orDash(email)}
                            </Link>
                        ) : (
                            <span className='text-dark/70'>{orDash(email)}</span>
                        )}
                        {actorEmail && actorEmail !== email && (
                            <p className='mt-0.5 text-[11px] text-dark/45'>by {actorEmail}</p>
                        )}
                    </div>
                );
            },
        });
    }

    columns.push(
        {
            id: 'app',
            header: 'App',
            cell: ({ row }) => (
                <span
                    className={
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                        appBadgeClasses(row.original.app)
                    }
                >
                    {appLabel(row.original.app)}
                </span>
            ),
        },
        {
            id: 'event',
            header: 'Event',
            cell: ({ row }) => {
                const { event, actorUserId, userId, email } = row.original;
                const byThemToSomeoneElse =
                    options.subjectId !== undefined &&
                    actorUserId === options.subjectId &&
                    userId !== options.subjectId;
                return (
                    <div>
                        <span
                            className={
                                'rounded-full px-2 py-0.5 text-[11px] font-medium ' + TONE[eventTone(event)]
                            }
                        >
                            {eventLabel(event)}
                        </span>
                        {byThemToSomeoneElse && (
                            <p className='mt-1 text-[11px] text-dark/50'>
                                done by this person to {orDash(email)}
                            </p>
                        )}
                    </div>
                );
            },
        }
    );

    if (options.signIn) {
        columns.push(
            {
                id: 'ip',
                header: 'IP address',
                cell: ({ row }) => <code className='text-xs text-dark/70'>{orDash(row.original.ipAddress)}</code>,
            },
            {
                id: 'agent',
                header: 'User agent',
                cell: ({ row }) => (
                    <span
                        className='block max-w-[280px] truncate text-xs text-dark/60'
                        title={row.original.userAgent ?? undefined}
                    >
                        {orDash(row.original.userAgent)}
                    </span>
                ),
            }
        );
    } else {
        columns.push({
            id: 'detail',
            header: 'Detail',
            cell: ({ row }) => (
                <span className='text-xs text-dark/60'>
                    {summariseMeta(row.original.event, row.original.meta) ?? '—'}
                </span>
            ),
        });
    }

    return columns;
}
