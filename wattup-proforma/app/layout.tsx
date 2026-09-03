import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

/**
 * Wraps the gate's pages (/login, the redirect at /, the 404) and the builder at
 * /tool, which is now a React page rather than a served folder of static files.
 * Nothing under this app may be indexed.
 *
 * suppressHydrationWarning is required by next-themes and only by it: the theme
 * class is written onto <html> by a blocking script before paint, so the server
 * markup and the first client render legitimately differ on that one attribute.
 * Without the script the panel flashes light before switching to dark.
 *
 * The font is the one wattup-frontend/app/layout.tsx loads, the same way, so
 * the login screen renders as a sibling of the dashboard's sign-in page.
 * Copied on 2026-09-02; keep in sync by hand (ADR 0001 §3: no shared code).
 */
const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-sans',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'WattUpUSA · Site Pro-Forma Builder',
    robots: { index: false, follow: false },
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang='en'
            className={`${plusJakartaSans.variable} h-full font-sans`}
            suppressHydrationWarning
        >
            <body className='flex min-h-full flex-col font-sans antialiased'>
                <ThemeProvider>
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
