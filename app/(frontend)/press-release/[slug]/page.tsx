import { getArticleBySlug } from '@/app/_actions/postActions';
import PressReleaseDetails from '@/components/press-release/press-release-details';
import PressReleaseDetailsHeader from '@/components/press-release/press-release-details-header';
import { PressReleaseDetailsSkeleton } from '@/components/skeletons/press-release-details-skeleton';
import { pressReleaseImageUrls } from '@/lib/images/press-release';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';
import { Suspense } from 'react';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return {
            title: 'Press Release Not Found | WattUp EV Charging',
            description: 'The requested press release could not be found.',
        };
    }

    const description = article.content
        ? article.content
              .replace(/<[^>]*>/g, ' ')
              .slice(0, 160)
              .trim() + '...'
        : 'Read the latest press release from WattUp EV Charging.';

    const imageUrl = article.image
        ? article.image
        : pressReleaseImageUrls.ogImage; // Fallback image

    return {
        title: `${article.title} | WattUp EV Charging`,
        description,
        openGraph: {
            title: `${article.title} | WattUp EV Charging`,
            description,
            type: 'article',
            publishedTime:
                article.publishedAt?.toISOString() ||
                article.createdAt.toISOString(),
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.imageAlt || article.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${article.title} | WattUp EV Charging`,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.imageAlt || article.title,
                },
            ],
        },
    };
}

// Extract the async content into a separate async component
async function PressReleaseContent({ params }: Props) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return (
            <>
                <PressReleaseDetailsHeader
                    title='Press Release Not Found'
                    date={formatDate(new Date())}
                />
                <article className='common-section-padding container mx-auto'>
                    <p>Press Release Not Found</p>
                </article>
            </>
        );
    }

    return (
        <>
            <PressReleaseDetailsHeader
                title={article.title}
                date={formatDate(article.publishedAt || article.createdAt)}
            />
            <PressReleaseDetails article={article} />
        </>
    );
}

// Page component stays synchronous — no await at top level
export default function PressReleaseDetailsPage({ params }: Props) {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            <Suspense fallback={<PressReleaseDetailsSkeleton />}>
                <PressReleaseContent params={params} />
            </Suspense>
        </main>
    );
}

