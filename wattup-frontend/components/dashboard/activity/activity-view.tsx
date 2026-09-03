'use client';

import { useTableState } from '@/components/data-table/use-table-state';
import { useActivityFacets, useActivityPage } from '@/hooks/use-activity';
import type { ActivityPage, ActivityScope } from '@/lib/dashboard/activity';

import { ActivityFilters } from './activity-filters';
import { ActivityDataTable } from './activity-table';

/**
 * The Activity screen.
 *
 * The shape every list screen on this dashboard follows: `useTableState` owns the URL,
 * a TanStack Query hook owns the data, and the shared DataTable owns the rendering. This
 * component only wires the three together and decides what its own filters are called.
 *
 * The server renders the first page and passes it as `initialPage`, so the screen arrives
 * with real rows rather than a skeleton. Everything after that is a client query, which
 * is what makes a filter or a page already seen come back in the same tick instead of
 * costing another round trip to a database 300ms away.
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
    const state = useTableState({ defaultLimit: initialPage.pageSize });

    // `scope` is a filter like any other, so it lives in the same URL state. The server's
    // reading of it seeds the first render.
    const scope: ActivityScope = (state.filters.scope ?? initialScope) === 'signin' ? 'signin' : 'all';
    const app = state.filters.app ?? '';
    const event = state.filters.event ?? '';
    const email = state.debouncedSearch;

    const query = { scope, page: state.page, app, event, email, limit: state.limit };
    const isDefaultView =
        scope === initialScope &&
        state.page === 1 &&
        state.limit === initialPage.pageSize &&
        !app &&
        !event &&
        !email;

    const { data: facets } = useActivityFacets(initialFacets);
    const { data, isPlaceholderData, isPending } = useActivityPage(
        query,
        // Only the view the server actually rendered may seed the cache. Handing it to
        // every key would answer one filter with another filter's rows.
        isDefaultView ? initialPage : undefined
    );

    const result = data ?? initialPage;
    const isFiltered = Boolean(app || event || email);

    return (
        <div className='flex flex-col gap-4'>
            <ActivityFilters
                scope={scope}
                app={app}
                event={event}
                search={state.search}
                facets={facets ?? initialFacets}
                // Placeholder data means the rows belong to the previous request. A plain
                // background refetch of rows that are current should not dim anything.
                pending={isPlaceholderData}
                isFiltered={isFiltered}
                onScopeChange={next => state.setFilter('scope', next === 'all' ? undefined : next)}
                onFilterChange={(key, value) => state.setFilter(key, value || undefined)}
                onSearchChange={state.setSearch}
                onClear={state.clear}
            />

            <ActivityDataTable
                result={result}
                scope={scope}
                isLoading={isPending}
                isStale={isPlaceholderData}
                isFiltered={isFiltered}
                showWho
                onPageChange={state.setPage}
                onLimitChange={state.setLimit}
            />
        </div>
    );
}
