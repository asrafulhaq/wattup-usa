import type { MetadataRoute } from 'next';

/**
 * /robots.txt: disallow everything. Checklist 5.10.
 *
 * The other half of the X-Robots-Tag header in next.config.ts: a crawler that
 * honours robots.txt never asks, and one that asks anyway is told noindex on
 * the answer. Next serves this at /robots.txt from the app root (the metadata
 * file conventions).
 */
export default function robots(): MetadataRoute.Robots {
    return { rules: { userAgent: '*', disallow: '/' } };
}
