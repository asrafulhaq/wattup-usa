import { getArticleBySlug, getArticles } from '@/app/_actions/postActions';
import BackButton from '@/components/home/back-button';
import { Reveal } from '@/components/reveal-animation';
import { Metadata } from 'next';
import ArticleDetailsPageContent from './components/page-content';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return {
            title: 'Article Not Found',
        };
    }

    // Strip HTML for description if content is rich text
    const description = article.content
        ? article.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
        : 'Read this article on WattUp';

    const charCount = article.content ? article.content.length : 0;
    const readingTime = Math.ceil(charCount / 1000) + ' min read';

    return {
        title: article.title,
        description: description,
        openGraph: {
            title: article.title,
            description: description,
            type: 'article',
            publishedTime: article.publishedAt?.toISOString(),
            modifiedTime: article.updatedAt?.toISOString(),
            authors: ['WattUp'],
            images: article.image
                ? [
                      {
                          url: article.image,
                          width: 1200,
                          height: 630,
                          alt: article.title,
                      },
                  ]
                : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: description,
            images: article.image ? [article.image] : [],
        },
        other: {
            'article:published_time': article.publishedAt?.toISOString() || '',
            'article:author': 'WattUp',
            'reading-time': readingTime,
        },
    };
}

export async function generateStaticParams() {
    const posts = await getArticles();

    return posts.map(post => ({
        slug: post.slug,
    }));
}
export default async function ArticleDetails({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) return null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        image: article.image || '',
        datePublished: article.publishedAt?.toISOString(),
        dateModified: article.updatedAt?.toISOString(),
        author: [
            {
                '@type': 'Person',
                name: 'WattUp',
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app/',
            },
        ],
    };

    return (
        <div className='flex flex-col gap-8 md:gap-12'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Back to Archive */}
            <Reveal delay={0.1}>
                <BackButton href='/' label='Back to Archive' />
            </Reveal>
            <ArticleDetailsPageContent params={params} />
        </div>
    );
}

