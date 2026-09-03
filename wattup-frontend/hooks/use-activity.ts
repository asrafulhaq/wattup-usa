'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchActivityFacets, fetchActivityPage } from '@/app/_actions/activity-actions';
import type { ActivityPage } from '@/lib/dashboard/activity';
import { activityKeys, type ActivityListParams } from '@/lib/query-keys';

/**
 * One page of the activity log, cached in the browser.
 *
 * `keepPreviousData` is the line that matters. Without it, changing a filter empties the
 * table while the next page loads, which is the flash this screen started with. With it,
 * the rows already on screen stay mounted and `isPlaceholderData` says they are one
 * filter behind, so the table can dim rather than disappear. Returning to a filter
 * already seen costs nothing at all: it is served from the cache in the same tick.
 *
 * The server action underneath checks VIEW_ACTIVITY_LOG on every call and returns an
 * empty page to anyone without it, so a hook is never the thing deciding access.
 */
export function useActivityPage(params: ActivityListParams, initialData?: ActivityPage) {
    return useQuery({
        queryKey: activityKeys.list(params),
        queryFn: () =>
            fetchActivityPage(
                params.scope,
                params.page,
                params.limit,
                params.app,
                params.event,
                params.email
            ),
        placeholderData: keepPreviousData,
        // The page the server already rendered, so the first paint is not a loading
        // state for data that is on the screen. Only the first, unfiltered view has it.
        initialData,
    });
}

/**
 * The apps and events actually present, for the filter controls.
 *
 * Long lived on purpose: the set of event names changes when someone deploys a new kind
 * of event, not while a person is looking at the page.
 */
export function useActivityFacets(initialData?: { apps: string[]; events: string[] }) {
    return useQuery({
        queryKey: activityKeys.facets(),
        queryFn: () => fetchActivityFacets(),
        staleTime: 5 * 60_000,
        initialData,
    });
}
