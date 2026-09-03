import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /*
     * There is deliberately no outputFileTracingIncludes and no
     * skipTrailingSlashRedirect here any more. Both existed for
     * app/tool/[[...path]]/route.ts, which read private/tool/ off the disk at
     * request time: the first because nothing imported those files so the build's
     * tracer could not see them, and the second because index.html loaded its CSS
     * and JS by relative path and therefore had to be served at /tool/ rather than
     * /tool.
     *
     * The builder is a React page now and the engine is imported, so the tracer
     * follows it like any other module, and /tool needs no trailing slash. Removing
     * the redirect skip matters: with it on, safeNext's '/tool/' default would 404
     * instead of being canonicalised to /tool by the framework.
     */


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
