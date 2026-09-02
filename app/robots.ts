import { MetadataRoute } from 'next';

/**
 * robots.txt, generated rather than static.
 *
 * There was also a public/robots.txt saying almost the same thing, and Next refuses to
 * serve a route that a public file already claims: the path returned a 500, so crawlers
 * never reached it and never found the sitemap line inside it. The static copy is gone.
 *
 * Generated, because the sitemap URL has to follow the deployment. The static file had
 * the preview domain baked in, which would have pointed production crawlers at a
 * different site.
 */
export default function robots(): MetadataRoute.Robots {
    const baseUrl = (
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app'
    ).replace(/\/$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                // The sign-in page and the whole dashboard. Both are auth gated, so this
                // is not what protects them; it keeps a login form and an admin shell out
                // of the index, where they are noise at best.
                '/admin',
                '/dashboard/',
                // Password reset links carry a token in the query string.
                '/reset-password',
                '/forgot-password',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
