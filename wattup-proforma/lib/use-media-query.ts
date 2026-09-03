'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Matches a media query, reactively.
 *
 * Safe to branch on here, where the usual hydration hazard does not apply:
 * components/builder/builder-app.tsx does not mount its interactive tree until
 * after hydration, so this never renders on the server and can never disagree
 * with server markup.
 *
 * It exists so the control rail is built ONCE. Rendering it in both the desktop
 * column and the mobile drawer and hiding one with CSS would mount forty-eight
 * inputs that nobody can see, on the device least able to afford them.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        },
        [query]
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false
    );
}

/** Tailwind's `lg`. Keep in step with the lg: classes in the builder's layout. */
export const LG = '(min-width: 64rem)';
