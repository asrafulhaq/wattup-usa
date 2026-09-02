import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /**
     * The Site Pro-Forma Builder is served from private/tool/ by
     * app/tool/[[...path]]/route.ts, which reads the files with fs at request
     * time. Nothing imports them, so the build's file tracing cannot see them,
     * and Vercel deploys only what the trace lists.
     *
     * WITHOUT THIS ENTRY THE ROUTE WORKS IN DEV AND 404s IN PRODUCTION.
     *
     * Keys are picomatch route globs matched against the route path (Next docs,
     * config/next-config-js/output.md). The brackets of the optional catch-all
     * MUST be escaped, the way that page's own example escapes them: Next
     * matches with picomatch's `contains` option, under which an unescaped
     * `[[...path]]` is a character class and never matches. Values are globs
     * resolved from this app's root. See ADR 0001 section 11.
     */
    outputFileTracingIncludes: {
        '/tool/\\[\\[\\.\\.\\.path\\]\\]': ['./private/tool/**/*'],
    },

    /**
     * index.html loads css/app.css and js/*.js by RELATIVE path, so the document
     * has to be served at /tool/ (with the slash) for those to resolve under
     * /tool/. Next's default trailingSlash: false would 308 /tool/ back to /tool
     * before the handler ran. trailingSlash: true is the wrong fix: it appends a
     * slash to every URL in the app, including POST /api/auth/sign-out. So the
     * framework's slash redirects are off, and the tool route does its own
     * canonicalisation (/tool -> /tool/). No other route relies on them.
     */
    skipTrailingSlashRedirect: true,

    /**
     * The backstop for checklist 5.9: nothing this app serves may be held by a
     * shared cache, indexed, sniffed into another type, framed, or leak its URL
     * as a referrer. The gate routes and the tool set most of these on their
     * own responses; this layer is for everything else, the login page and its
     * static chunks included, so a route added later cannot forget. `/(.*)` is
     * every path, `/` included.
     *
     * Referrer-Policy: no-referrer nulls the Origin of a form NAVIGATION post
     * but not of a fetch() in cors mode, which is what app/login sends, so the
     * origin check in lib/gate.ts keeps working. Recorded there as well.
     */
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                    { key: 'Cache-Control', value: 'no-store' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                ],
            },
        ];
    },
};

export default nextConfig;
