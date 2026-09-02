import { MetadataRoute } from 'next';
import { getArticles } from '@/app/_actions/postActions';
import { getPublicStations } from '@/lib/locations/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app'
).replace(/\/$/, '');

    // Static routes
    const staticRoutes = [
        '',
        '/about',
        '/contact',
        '/for-drivers',
        '/for-hosts',
        '/capital-partners',
        '/faq',
        '/locations',
        '/fleet-solution',
        '/press-release',
        '/policy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes for press releases
    let articleRoutes: MetadataRoute.Sitemap = [];
    try {
        // getArticles is Published only inside its query; nothing passed here can widen it.
        const articles = await getArticles(1, 1000);

        articleRoutes = articles.map((article) => ({
            url: `${baseUrl}/press-release/${article.slug}`,
            lastModified: article.updatedAt || article.publishedAt || article.createdAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Error generating press release sitemap routes:', error);
    }

    /**
     * One entry per published charging site.
     *
     * These pages exist to be found: "EV charging near Redlands" is a query people type,
     * and a map alone is invisible to it. Leaving them out of the sitemap left the whole
     * point of building them resting on internal links.
     *
     * Read through getPublicStations, so an unpublished site drops out of the sitemap at
     * the same moment it drops off the map, rather than pointing crawlers at a 404.
     */
    let stationRoutes: MetadataRoute.Sitemap = [];
    try {
        const stations = await getPublicStations();

        stationRoutes = stations
            // A page marked noindex in the dashboard is dropped here too. Listing a page
            // in the sitemap while telling crawlers not to index it is a contradiction
            // Search Console reports as an error.
            .filter((station) => !station.noIndex)
            .map((station) => ({
                url: `${baseUrl}/locations/${station.slug}`,
                // The real edit date, not the build date. Every page claiming to have
                // changed on every deploy teaches crawlers to ignore the field.
                lastModified: new Date(station.updatedAt),
                changeFrequency: 'monthly' as const,
                // Above a press release: a station page answers a search with local
                // intent, which is the traffic this site actually wants.
                priority: 0.7,
            }));
    } catch (error) {
        console.error('Error generating station sitemap routes:', error);
    }

    return [...staticRoutes, ...stationRoutes, ...articleRoutes];
}


