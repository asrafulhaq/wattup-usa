import { MetadataRoute } from 'next';
import { getArticles } from '@/app/_actions/postActions';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app';

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
    try {
        const articles = await getArticles(1, 1000, 'Published');
        
        const dynamicRoutes = articles.map((article) => ({
            url: `${baseUrl}/press-release/${article.slug}`,
            lastModified: article.updatedAt || article.publishedAt || article.createdAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...dynamicRoutes];
    } catch (error) {
        console.error('Error generating dynamic sitemap routes:', error);
        return staticRoutes;
    }
}

