/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPaginatedArticles } from '@/app/_actions/postActions';
import { PressReleaseListContent } from './press-release-list-content';

export async function BlogPostList() {
    const { articles, hasNextPage } = await getPaginatedArticles(1, 10, 'Published');

    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding max-md:pt-0! overflow-hidden'>
            <PressReleaseListContent
                initialArticles={articles as any}
                initialHasNextPage={hasNextPage}
            />
        </section>
    );
}

