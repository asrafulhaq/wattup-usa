'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Theme for the control panel only.
 *
 * The pro-forma document is deliberately outside this. It renders in an iframe
 * with its own stylesheet and its own `design.ink` and `design.accent`, because it
 * is a printed sales document: a landlord's PDF must not change because whoever
 * built it preferred a dark editor. Nothing in components/builder/preview may read
 * the theme.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            // The tool redraws a full document on every keystroke; letting CSS
            // transitions run through a theme flip on top of that is visible jank.
            disableTransitionOnChange
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
