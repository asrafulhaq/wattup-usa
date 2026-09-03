'use client';

import { useSyncExternalStore } from 'react';

/** Nothing ever changes, so a subscriber is never called. */
const subscribe = () => () => {};

/**
 * False while rendering on the server and during the first client render, true
 * afterwards.
 *
 * This is React's own answer to "is it safe to read the browser yet", and it is
 * here instead of the usual `useState(false)` plus `useEffect(() => set(true))`
 * because that pattern sets state synchronously inside an effect, which schedules
 * a second render pass of the whole tree for information React can hand over
 * directly.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
}
