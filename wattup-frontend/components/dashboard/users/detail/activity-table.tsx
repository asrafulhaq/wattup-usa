import Link from 'next/link';

import type { ActivityPage, ActivityScope } from '@/lib/dashboard/activity';

import {
    appBadgeClasses,
    appLabel,
    eventLabel,
    eventTone,
    orDash,
    summariseMeta,
} from './activity-format';

/**
 * One user's activity_log rows (checklist 4c.6) and, in the sign-in variant, the same
 * table narrowed to sign-in events with the IP address and user agent (4c.7).
 *
 * Both applications write to that table, so a row here may have come from the dashboard
 * or from the pro-forma builder, and the App column says which. That is the whole
 * reason the two share a database rather than talking over HTTP.
 *
 * Server rendered, and paginated through the URL rather than through state, so a page
 * of someone's history can be linked to and survives a reload. The page number is the
 * only thing the links change; the tab is a separate parameter.
 */

const TONE_CLASSES: Record<'neutral' | 'good' | 'bad', string> = {
    neutral: 'bg-dash-canvas text-dark/70 border border-dash-border',
    good: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    bad: 'bg-red-50 text-red-700 border border-red-200',
};

function formatWhen(value: Date): string {
    // A fixed format rather than a relative one: an audit table is read to answer "when
    // exactly", and "3 days ago" is the one thing it must not say.
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(value);
}

function Pagination({
    page,
    total,
    pageSize,
    scope,
    basePath,
    params,
    onPageChange,
}: {
    page: number;
    total: number;
    pageSize: number;
    scope: ActivityScope;
    basePath: string;
    params: Record<string, string>;
    /** When given, paging is handled by the caller and no navigation happens. */
    onPageChange?: (page: number) => void;
}) {
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    if (lastPage <= 1) return null;

    const box = 'rounded-lg border border-dash-border px-3 py-1.5 text-xs font-medium';

    /**
     * A link on the per-person page, where paging is a navigation, and a button on the
     * Activity screen, where the parent holds the data and a navigation would throw away
     * the cache it is paging through.
     *
     * A plain function called directly rather than a component used as <Step />: a
     * component declared inside a render is a new type on every render, so React would
     * remount it each time and any state in it would reset.
     */
    const step = (to: number, enabled: boolean, label: string) => {
        if (!enabled) return <span className={`${box} text-dark/30`}>{label}</span>;
        if (onPageChange) {
            return (
                <button type='button' onClick={() => onPageChange(to)} className={`${box} text-dark hover:bg-dash-canvas`}>
                    {label}
                </button>
            );
        }
        return (
            <Link href={href(to)} prefetch className={`${box} text-dark hover:bg-dash-canvas`}>
                {label}
            </Link>
        );
    };

    const key = scope === 'signin' ? 'signinPage' : 'activityPage';
    // Keep every other parameter. Without this, paging on the site-wide page silently
    // dropped the filters and jumped back to the unfiltered log.
    const href = (target: number) => {
        const next = new URLSearchParams(params);
        next.set(key, String(target));
        return `${basePath}?${next.toString()}#${scope}`;
    };
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className='flex items-center justify-between gap-4 border-t border-dash-border px-4 py-3'>
            <p className='text-xs text-dark/50'>
                {first} to {last} of {total}
            </p>
            <div className='flex gap-2'>
                {step(page - 1, page > 1, 'Previous')}
                {step(page + 1, page < lastPage, 'Next')}
            </div>
        </div>
    );
}

export function ActivityTable({
    result,
    scope,
    basePath,
    subjectId,
    params = {},
    showWho = false,
    onPageChange,
}: {
    result: ActivityPage;
    scope: ActivityScope;
    basePath: string;
    /**
     * Tells a row this person carried out from one that happened to them. Undefined on
     * the site-wide page, where every row belongs to somebody different.
     */
    subjectId?: string;
    /** The page's other query parameters, so paging keeps the filters. */
    params?: Record<string, string>;
    /** Adds the Who column. On a person's own page it would repeat their name on every row. */
    showWho?: boolean;
    /** When given, paging calls this instead of navigating. */
    onPageChange?: (page: number) => void;
}) {
    if (result.rows.length === 0) {
        return (
            <p className='rounded-lg border border-dash-border px-4 py-6 text-center text-sm text-dark/50'>
                {scope === 'signin'
                    ? 'No sign-ins recorded for this account yet.'
                    : 'Nothing recorded for this account yet.'}
            </p>
        );
    }

    const showsClient = scope === 'signin';

    return (
        <div className='overflow-hidden rounded-lg border border-dash-border'>
            <div className='overflow-x-auto'>
                <table className='w-full min-w-[640px] text-left'>
                    <thead className='border-b border-dash-border bg-dash-canvas/60'>
                        <tr className='text-[11px] uppercase tracking-wide text-dark/50'>
                            <th scope='col' className='px-4 py-2.5 font-medium'>When (UTC)</th>
                            {showWho && <th scope='col' className='px-4 py-2.5 font-medium'>Who</th>}
                            <th scope='col' className='px-4 py-2.5 font-medium'>App</th>
                            <th scope='col' className='px-4 py-2.5 font-medium'>Event</th>
                            {showsClient ? (
                                <>
                                    <th scope='col' className='px-4 py-2.5 font-medium'>IP address</th>
                                    <th scope='col' className='px-4 py-2.5 font-medium'>User agent</th>
                                </>
                            ) : (
                                <th scope='col' className='px-4 py-2.5 font-medium'>Detail</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-dash-border'>
                        {result.rows.map(row => {
                            const byThemToSomeoneElse =
                                subjectId !== undefined &&
                                row.actorUserId === subjectId &&
                                row.userId !== subjectId;
                            const summary = summariseMeta(row.event, row.meta);
                            return (
                                <tr key={row.id} className='align-top'>
                                    <td className='whitespace-nowrap px-4 py-3 text-xs text-dark/60'>
                                        {formatWhen(row.createdAt)}
                                    </td>
                                    {showWho && (
                                        <td className='px-4 py-3 text-xs'>
                                            {row.userId ? (
                                                <Link
                                                    href={`/dashboard/users/${row.userId}`}
                                                    className='text-primary hover:underline'
                                                >
                                                    {orDash(row.email)}
                                                </Link>
                                            ) : (
                                                <span className='text-dark/70'>{orDash(row.email)}</span>
                                            )}
                                            {row.actorEmail && row.actorEmail !== row.email && (
                                                <p className='mt-0.5 text-[11px] text-dark/45'>
                                                    by {row.actorEmail}
                                                </p>
                                            )}
                                        </td>
                                    )}
                                    <td className='px-4 py-3'>
                                        <span className={'rounded-full px-2 py-0.5 text-[10px] font-semibold ' + appBadgeClasses(row.app)}>
                                            {appLabel(row.app)}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3'>
                                        <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + TONE_CLASSES[eventTone(row.event)]}>
                                            {eventLabel(row.event)}
                                        </span>
                                        {byThemToSomeoneElse && (
                                            <p className='mt-1 text-[11px] text-dark/50'>
                                                done by this person to {orDash(row.email)}
                                            </p>
                                        )}
                                    </td>
                                    {showsClient ? (
                                        <>
                                            <td className='px-4 py-3 text-xs text-dark/70'>
                                                <code>{orDash(row.ipAddress)}</code>
                                            </td>
                                            <td className='max-w-[280px] px-4 py-3 text-xs text-dark/60'>
                                                <span className='block truncate' title={row.userAgent ?? undefined}>
                                                    {orDash(row.userAgent)}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <td className='px-4 py-3 text-xs text-dark/60'>{summary ?? '—'}</td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination
                page={result.page}
                total={result.total}
                pageSize={result.pageSize}
                scope={scope}
                basePath={basePath}
                params={params}
                onPageChange={onPageChange}
            />
        </div>
    );
}
