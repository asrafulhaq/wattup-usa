import type { ActivityScope } from '@/lib/dashboard/activity';

/**
 * Every TanStack Query key the dashboard uses, in one place.
 *
 * They live together for the same reason the server's cache tags do (`lib/cache-tags.ts`):
 * the code that reads and the code that invalidates are in different files, and a key
 * written out by hand at both ends drifts silently. A stale screen after a change nobody
 * can reproduce is almost always two keys that were meant to be the same string.
 *
 * The shape is the usual hierarchy, broad to narrow, so a mutation can invalidate at
 * whatever level it actually affects:
 *
 *   activity.all              everything activity related
 *   activity.list({...})      one page of one filter
 *
 * `invalidateQueries({ queryKey: activityKeys.all })` therefore clears every filter and
 * every page at once, which is what a new audit row means: any of them might now differ.
 */

export interface ActivityListParams {
    scope: ActivityScope;
    page: number;
    limit: number;
    app: string;
    event: string;
    email: string;
}

export const activityKeys = {
    all: ['activity'] as const,
    lists: () => [...activityKeys.all, 'list'] as const,
    list: (params: ActivityListParams) => [...activityKeys.lists(), params] as const,
    facets: () => [...activityKeys.all, 'facets'] as const,
};

export const articleKeys = {
    all: ['articles'] as const,
    lists: () => [...articleKeys.all, 'list'] as const,
    list: (page: number, pageSize: number) => [...articleKeys.lists(), { page, pageSize }] as const,
};

export const userKeys = {
    all: ['users'] as const,
    detail: (id: string) => [...userKeys.all, 'detail', id] as const,
    permissions: (id: string) => [...userKeys.all, 'permissions', id] as const,
};
