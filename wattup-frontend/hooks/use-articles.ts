'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { getArticlesForDashboard } from '@/app/_actions/postActions';
import { articleKeys } from '@/lib/query-keys';

/**
 * One page of the dashboard's article list.
 *
 * This replaces a `useState` plus `useEffect` fetch machine that lived in the table
 * component: it refetched on mount, had its own "skip the first fetch" guard, held its
 * own loading boolean and its own copy of the row count, and none of that was shared
 * with any other list. The same three problems appeared in every screen that grew a
 * table, which is the reason this codebase is moving to one hook shape.
 *
 * `keepPreviousData` is what makes paging feel instant: the rows already on screen stay
 * mounted while the next page loads, and `isPlaceholderData` tells the table to dim
 * rather than empty itself.
 *
 * The action underneath checks CREATE_POST and falls back to published articles only for
 * anyone without it, so this hook never decides who sees drafts.
 */
export function useArticles(page: number, pageSize: number) {
    return useQuery({
        queryKey: articleKeys.list(page, pageSize),
        queryFn: () => getArticlesForDashboard(page, pageSize),
        placeholderData: keepPreviousData,
    });
}

export type ArticlesPage = Awaited<ReturnType<typeof getArticlesForDashboard>>;

/**
 * Invalidate every article list after a change.
 *
 * Publishing, deleting or duplicating changes what is on other pages too, not just the
 * one in front of you, so this clears them all rather than trying to be clever about
 * which. The server tag is invalidated by the action itself; this is the browser half.
 */
export function useInvalidateArticles() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: articleKeys.all });
}
