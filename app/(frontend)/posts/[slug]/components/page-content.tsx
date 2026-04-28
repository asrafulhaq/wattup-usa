import { getArticleBySlug } from '@/app/_actions/postActions';
import { Reveal } from '@/components/reveal-animation';
import { ArticleListSkeleton } from '@/components/skeletons/article-list-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ArticleContent from './article-content';
import ArticleHeader from './article-details-header';
import FooterMetadata from './footer-meta';
import RelatedArticles from './related-articles';

const ArticleDetailsPageContent = async ({
    params,
}: {
    params: Promise<{ slug: string }>;
}) => {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const formattedArticle = {
        ...article,
        date: article.createdAt.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }),
    };

    return (
        <div>
            {/* Article Header */}
            <Reveal delay={0.2}>
                <ArticleHeader article={formattedArticle as any} />
            </Reveal>

            {/* Article Content */}
            <Reveal delay={0.3}>
                <ArticleContent article={formattedArticle as any} />
            </Reveal>

            {/* Footer Metadata */}
            <Reveal delay={0.4}>
                <FooterMetadata article={formattedArticle as any} />
            </Reveal>


            <hr className='border-border -mx-4 md:-mx-10' />

            {/* More from Arnav */}
            <Suspense
                fallback={
                    <div className='flex flex-col py-6 gap-12'>
                        <Reveal>
                            <div className='flex items-center justify-between'>
                                <Skeleton className='h-[14px] w-16' />
                            </div>
                        </Reveal>
                        <div className='flex flex-col gap-12'>
                            <ArticleListSkeleton />
                        </div>
                    </div>
                }>
                <RelatedArticles slug={slug} />
            </Suspense>
        </div>
    );
};

export default ArticleDetailsPageContent;

