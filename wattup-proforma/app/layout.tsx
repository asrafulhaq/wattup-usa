import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import './globals.css';

/**
 * The only pages this layout wraps are the gate's own: /login, the redirect
 * at /, and the 404. The tool is served by a route handler and never renders
 * through here. Nothing under this app may be indexed.
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
        <html lang="en" className={`${plusJakartaSans.variable} h-full font-sans`}>
            <body className="flex min-h-full flex-col font-sans antialiased">{children}</body>
        </html>
    );
}
