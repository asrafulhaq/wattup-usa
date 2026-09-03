'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * URL-synced list state: page, page size, debounced search and named filters.
 *
 * One instance per list screen, so every table on the dashboard restores the same way
 * from a reload, a back button or a pasted link, and no screen hand-rolls its own
 * useState plus debounce machine. Modelled on the same hook in the tripwheel dashboard,
 * which this codebase is aligning with.
 *
 * THE URL IS THE STATE, AND IT IS WRITTEN SHALLOWLY. `window.history.replaceState`
 * rather than `router.replace`, because a router write re-renders the server component
 * for the new URL, and on a client-fetched list that round trip IS the perceived
 * latency: measured here, a filter already held in the query cache still took 1.2
 * seconds through the router and 11ms through the History API. Next keeps
 * `useSearchParams` and `usePathname` in sync with these calls, so nothing else has to
 * change. The rule that makes it safe: a page using this hook must not read
 * `searchParams` on the server for anything but its first render.
 */

/** Keys this hook owns. Everything else in the URL is treated as a named filter. */
const RESERVED = ['page', 'limit', 'q'] as const;

const SEARCH_DEBOUNCE_MS = 300;

export interface TableState {
    page: number;
    limit: number;
    /** The raw input value. Bind the search box to this. */
    search: string;
    /** Debounced. Put THIS in a query key, never `search`. */
    debouncedSearch: string;
    /** Named filters: status, app, event, anything a screen invents. */
    filters: Record<string, string | undefined>;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearch: (value: string) => void;
    /** Setting a filter returns to page one. `undefined` clears the key. */
    setFilter: (key: string, value: string | undefined) => void;
    /**
     * Several filters in one write.
     *
     * Two `setFilter` calls in the same tick clobber each other: each builds its params
     * from the same render-time snapshot, so the second starts without the first's key
     * and silently reverts it. Any handler touching two keys at once goes through this.
     */
    setFilters: (patch: Record<string, string | undefined>) => void;
    /** Clears every named filter and the search, keeping the page size. */
    clear: () => void;
}

export function useTableState(options?: { defaultLimit?: number }): TableState {
    const defaultLimit = options?.defaultLimit ?? 20;
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || defaultLimit);
    const urlSearch = searchParams.get('q') ?? '';

    const filters = useMemo(() => {
        const out: Record<string, string | undefined> = {};
        searchParams.forEach((value, key) => {
            if (!(RESERVED as readonly string[]).includes(key)) out[key] = value;
        });
        return out;
    }, [searchParams]);

    // The box is local state so typing never waits on anything; the URL carries only the
    // settled value.
    const [search, setSearchState] = useState(urlSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

    // Follow the URL when it changes from outside, a Clear button or the back button.
    // Adjusted during render rather than in an effect, which would paint stale text for
    // a frame and render twice.
    const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
    if (urlSearch !== lastUrlSearch) {
        setLastUrlSearch(urlSearch);
        setSearchState(urlSearch);
        setDebouncedSearch(urlSearch);
    }

    const write = useCallback(
        (mutate: (params: URLSearchParams) => void) => {
            const params = new URLSearchParams(searchParams.toString());
            mutate(params);
            const qs = params.toString();
            window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
        },
        [pathname, searchParams]
    );

    const setPage = useCallback(
        (next: number) =>
            write(p => {
                if (next <= 1) p.delete('page');
                else p.set('page', String(next));
            }),
        [write]
    );

    const setLimit = useCallback(
        (next: number) =>
            write(p => {
                if (next === defaultLimit) p.delete('limit');
                else p.set('limit', String(next));
                // A different page size makes the current page number meaningless.
                p.delete('page');
            }),
        [write, defaultLimit]
    );

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const setSearch = useCallback(
        (value: string) => {
            setSearchState(value);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                const trimmed = value.trim();
                setDebouncedSearch(trimmed);
                setLastUrlSearch(trimmed);
                write(p => {
                    if (trimmed) p.set('q', trimmed);
                    else p.delete('q');
                    p.delete('page');
                });
            }, SEARCH_DEBOUNCE_MS);
        },
        [write]
    );

    const setFilters = useCallback(
        (patch: Record<string, string | undefined>) =>
            write(p => {
                for (const [key, value] of Object.entries(patch)) {
                    if (value) p.set(key, value);
                    else p.delete(key);
                }
                p.delete('page');
            }),
        [write]
    );

    const setFilter = useCallback(
        (key: string, value: string | undefined) => setFilters({ [key]: value }),
        [setFilters]
    );

    const clear = useCallback(() => {
        setSearchState('');
        setDebouncedSearch('');
        setLastUrlSearch('');
        write(p => {
            for (const key of [...p.keys()]) {
                if (key !== 'limit') p.delete(key);
            }
        });
    }, [write]);

    return {
        page,
        limit,
        search,
        debouncedSearch,
        filters,
        setPage,
        setLimit,
        setSearch,
        setFilter,
        setFilters,
        clear,
    };
}
