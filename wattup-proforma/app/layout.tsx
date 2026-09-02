import type { Metadata } from 'next';

import './globals.css';

/**
 * The only pages this layout wraps are the gate's own: /login, the redirect
 * at /, and the 404. The tool is served by a route handler and never renders
 * through here. Nothing under this app may be indexed.
 */
export const metadata: Metadata = {
    title: 'WattUpUSA · Site Pro-Forma Builder',
    robots: { index: false, follow: false },
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang="en" className="h-full antialiased">
            <head>
                {/* Satoshi, loaded the way the previous gate loaded it, so the two render the same. */}
                <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,400&display=swap"
                />
            </head>
            <body className="flex min-h-full flex-col">{children}</body>
        </html>
    );
}
