import { Suspense } from 'react';


import { ActivityTable } from '@/components/dashboard/users/detail/activity-table';
import { ActivityView } from '@/components/dashboard/activity/activity-view';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import {
    getActivityFacets,
    getSiteActivity,
    type ActivityScope,
} from '@/lib/dashboard/activity';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';

export const metadata = {
    title: 'Activity | WattUp',
    description: 'Everything both applications have recorded.',
};

/**
 * The whole audit trail, everyone's (the client asked for this on 2026-09-03).
 *
 * The same table a person's own page draws, without the filter that narrows it to one
 * account, so it answers "what has been happening" rather than "what has this person
 * been doing". Both applications write to `activity_log`, so a pro-forma sign-in sits
 * next to a dashboard permission change, which is the point of one shared table.
 *
 * Gated on `VIEW_ACTIVITY_LOG`, the same permission the per-person sections use, and
 * the reader behind it checks that permission again for itself. The sidebar entry is
 * drawn only for holders, so nobody is shown a door they cannot open.
 *
 * State lives in the URL, not in a component: a filtered page can be linked to, survives
 * a reload, and needs no client-side data fetching at all.
 */

function one(value: string | string[] | undefined): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
}

function pageParam(value: string | string[] | undefined): number {
    const parsed = Number(one(value));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** Holds the table's space while it loads, so the filters above it do not jump. */
function TableSkeleton() {
    return (
        <div className='overflow-hidden rounded-lg border border-dash-border'>
            <div className='h-10 border-b border-dash-border bg-dash-canvas/60' />
            {Array.from({ length: 10 }, (_, row) => (
                <div key={row} className='flex gap-4 border-b border-dash-border px-4 py-3 last:border-0'>
                    <div className='h-4 w-32 animate-pulse rounded bg-dash-canvas' />
                    <div className='h-4 w-44 animate-pulse rounded bg-dash-canvas' />
                    <div className='h-4 w-20 animate-pulse rounded bg-dash-canvas' />
                    <div className='h-4 flex-1 animate-pulse rounded bg-dash-canvas' />
                </div>
            ))}
        </div>
    );
}

/** The rows and the count, read here so Suspense can stream them. */
async function ActivityRows({
    scope,
    page,
    filter,
    params,
    filtered,
}: {
    scope: ActivityScope;
    page: number;
    filter: { app?: string; event?: string; email?: string };
    params: Record<string, string>;
    filtered: boolean;
}) {
    const result = await getSiteActivity({ scope, page, filter });
    return (
        <>
            <p className='text-sm text-dark/50'>
                {result.total} {result.total === 1 ? 'entry' : 'entries'}
                {filtered ? ' match these filters.' : ' recorded.'}
            </p>
            <ActivityTable
                result={result}
                scope={scope}
                basePath='/dashboard/activity'
                params={params}
                showWho
            />
        </>
    );
}

export default async function ActivityPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;

    if (!hasPermission(permissions, Permission.VIEW_ACTIVITY_LOG)) {
        return <NoAccess what='the activity log' role={session.role} />;
    }

    const query = await searchParams;
    const scope: ActivityScope = one(query.scope) === 'signin' ? 'signin' : 'all';
    const filter = {
        app: one(query.app),
        event: one(query.event),
        email: one(query.email),
    };
    const page = pageParam(scope === 'signin' ? query.signinPage : query.activityPage);

    // Only the facets are awaited: they are two cheap distinct queries and the filter
    // controls need them to render. The page of rows is streamed below, so the header,
    // the tabs and the filters paint immediately rather than waiting on the log.
    const facets = await getActivityFacets();

    // Carried into the pagination links so paging keeps the filters and the tab.
    const params: Record<string, string> = {};
    if (scope !== 'all') params.scope = scope;
    for (const [key, value] of Object.entries(filter)) if (value) params[key] = value;

    const filtered = Boolean(filter.app || filter.event || filter.email);

    return (
        <PageShell>
            <PageHeader
                title='Activity'
                description='Everything the dashboard and the pro-forma builder have recorded, newest first.'
            />

            {/* The filters are a client component and the table is not: it is passed
                through as children, so a filter change is a transition that keeps the
                current rows on screen instead of a navigation that unmounts them. */}
            <ActivityView
                scope={scope}
                app={filter.app ?? ''}
                event={filter.event ?? ''}
                email={filter.email ?? ''}
                facets={facets}
            >
                <Suspense fallback={<TableSkeleton />}>
                    <ActivityRows
                        scope={scope}
                        page={page}
                        filter={filter}
                        params={params}
                        filtered={filtered}
                    />
                </Suspense>
            </ActivityView>
        </PageShell>
    );
}
