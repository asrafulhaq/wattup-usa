'use client';

import { useSearchParams } from 'next/navigation';

import { ActivityFilters } from './activity-filters';
import { ActivityTable } from '@/components/dashboard/users/detail/activity-table';
import { useActivityFacets, useActivityPage } from '@/hooks/use-activity';
import type { ActivityPage, ActivityScope } from '@/lib/dashboard/activity';

/**
 * The Activity screen: filters, count and table.
 *
 * The server renders the first page and hands it in as `initialPage`, so the first paint
 * is real content rather than a spinner. After that every change is a client query
 * against the cache, and only a page and filter nobody has looked at yet costs a round
 * trip. A filter you have used before comes back in the same tick.
 *
 * The URL still carries the state, so a filtered view remains a link somebody can send
 * and the back button still works. What it no longer does is drive a full navigation:
 * the URL is updated for the address bar and history, and the data comes from the query.
 */
export function ActivityView({
    initialScope,
    initialPage,
    initialFacets,
}: {
    initialScope: ActivityScope;
    initialPage: ActivityPage;
    initialFacets: { apps: string[]; events: string[] };
}) {
    const params = useSearchParams();

    // The URL is the source of truth for what is being shown, read fresh on every render
    // so the back button and a pasted link behave identically to a click.
    const scope: ActivityScope = params.get('scope') === 'signin' ? 'signin' : initialScope;
    const app = params.get('app') ?? '';
    const event = params.get('event') ?? '';
    const email = params.get('email') ?? '';
    const pageParam = Number(params.get(scope === 'signin' ? 'signinPage' : 'activityPage'));
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    const query = { scope, page, app, event, email };
    const unfiltered = scope === 'all' && page === 1 && !app && !event && !email;

    const { data: facets } = useActivityFacets(initialFacets);
    const { data, isPlaceholderData, isFetching } = useActivityPage(
        query,
        // Only the view the server actually rendered may seed the cache. Handing this to
        // every key would show the unfiltered first page as though it were the answer to
        // whatever filter was asked for.
        unfiltered ? initialPage : undefined
    );

    const result = data ?? initialPage;
    // Placeholder means these rows belong to the previous filter. Fetching without it
    // means a background refresh of rows that are current. Only the first should dim.
    const behind = isPlaceholderData;

    /**
     * Update the URL without navigating.
     *
     * The native History API rather than `router.push`/`router.replace`, and the
     * difference is the entire point of this screen. A router call re-renders the server
     * component for the new URL, so every filter change paid the round trip again even
     * when the answer was already in the client cache: measured, a repeat filter still
     * took 1.2 seconds. `pushState` and `replaceState` are integrated into the Next
     * router and sync with `useSearchParams` (next/dist/docs, guides/single-page-
     * applications, "Shallow routing on the client"), so the URL, the back button and
     * this component all stay in step and nothing is fetched that the cache already has.
     *
     * replace for filtering, which is refining one view; push for paging, which is a step
     * a person expects the back button to undo.
     */
    function setParams(changes: Record<string, string | null>, options?: { push?: boolean }): void {
        const next = new URLSearchParams(params.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        const query = next.toString();
        const url = `/dashboard/activity${query ? `?${query}` : ''}`;
        if (options?.push) window.history.pushState(null, '', url);
        else window.history.replaceState(null, '', url);
    }

    const filtered = Boolean(app || event || email);

    return (
        <div className='flex flex-col gap-4'>
            <ActivityFilters
                scope={scope}
                app={app}
                event={event}
                email={email}
                facets={facets ?? initialFacets}
                pending={behind || isFetching}
                onChange={changes =>
                    setParams({
                        ...changes,
                        // Any change to what is shown starts again at page one; keeping
                        // the number lands on page 4 of a result set that now has one.
                        activityPage: null,
                        signinPage: null,
                    })
                }
            />

            <p className='text-sm text-dark/50'>
                {scope === 'signin'
                    ? 'Sign-ins and code requests, with the address and browser.'
                    : 'Every event either application has recorded.'}{' '}
                {result.total} {result.total === 1 ? 'entry' : 'entries'}
                {filtered ? ' match these filters.' : ' recorded.'}
            </p>

            {/*
                Dimmed while the rows belong to the previous filter. Not hidden and not
                replaced: what is on screen is still true, it is one filter behind, and
                showing it beats showing nothing. Pointer events go so a click cannot
                land on a row that is about to be replaced.
            */}
            <div
                aria-busy={behind}
                className={
                    'transition-opacity duration-150 ' +
                    (behind ? 'pointer-events-none opacity-50' : 'opacity-100')
                }
            >
                <ActivityTable
                    result={result}
                    scope={scope}
                    basePath='/dashboard/activity'
                    showWho
                    onPageChange={target =>
                        setParams(
                            scope === 'signin'
                                ? { signinPage: String(target) }
                                : { activityPage: String(target) },
                            { push: true }
                        )
                    }
                />
            </div>
        </div>
    );
}
