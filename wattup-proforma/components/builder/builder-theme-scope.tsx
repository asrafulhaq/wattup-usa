'use client';

import { useEffect } from 'react';

/**
 * Puts `data-builder` on the <html> element for as long as the builder is mounted.
 *
 * The neutral palette in app/globals.css is scoped to `[data-builder]` so /login
 * keeps the shared taupe palette it deliberately shares with the dashboard's
 * sign-in screen. Scoping it to a wrapper DIV was not enough: every Radix overlay
 * (the mobile drawer, the dropdowns, the dialogs, the tooltips) renders through a
 * portal attached to document.body, which sits OUTSIDE that div. Those surfaces
 * kept the warm tokens, so the drawer's inputs and note boxes came back beige
 * while the same components in the rail were neutral.
 *
 * On the root element it covers the portals too, because they are its descendants.
 * An attribute write, not state: nothing re-renders, and it is removed on unmount
 * so a client navigation to /login restores the shared palette.
 */
export function BuilderThemeScope() {
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-builder', '');
        return () => root.removeAttribute('data-builder');
    }, []);

    return null;
}
