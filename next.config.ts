import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const contentSecurityPolicy = [
    "default-src 'self'",
    // 'unsafe-inline' is required: the GTM loader, JSON-LD, and admin-injected
    // scripts are inline; 'unsafe-eval' is dev-only for React Fast Refresh
    // CMP domains cover both supported vendors: CookieYes (cdn-cookieyes.com,
    // log.cookieyes.com) and Cookiebot (consent.cookiebot.com, consentcdn.cookiebot.com)
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://cdn-cookieyes.com https://consent.cookiebot.com https://consentcdn.cookiebot.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://cdn-cookieyes.com https://consent.cookiebot.com https://imgsdk.cookiebot.com https://api.mapbox.com",
    "media-src 'self' blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    // Mapbox GL fetches styles, tiles, fonts and sprites from api.mapbox.com, and
    // reports usage to events.mapbox.com. Without both the map renders blank with no
    // console error that points at the cause.
    "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://cdn-cookieyes.com https://log.cookieyes.com https://consentcdn.cookiebot.com https://api.mapbox.com https://events.mapbox.com",
    // Mapbox GL builds its tile workers from blob URLs. Browsers check worker-src for
    // that, falling back to child-src, so both are set rather than loosening script-src.
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src https://www.googletagmanager.com https://consentcdn.cookiebot.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
].join('; ');

const securityHeaders = [
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        // geolocation is (self) rather than () because the station finder's "use my
        // location" needs it. An empty allowlist is a hard browser block, so the
        // feature cannot work without this. Third party frames are still denied.
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
    },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    cacheComponents: true,
    /* config options here */
    output: 'standalone',
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    async headers() {
        return [{ source: '/(.*)', headers: securityHeaders }];
    },
};

export default nextConfig;

