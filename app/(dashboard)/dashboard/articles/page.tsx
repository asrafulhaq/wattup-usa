/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPaginatedArticles } from '@/app/_actions/postActions';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Suspense } from 'react';
import PageTitle from '../../../../components/dashboard/page-title';
import { ArticlesDataTable } from '../../../../components/dashboard/articles/articles-data-table';

export async function ArticlesTable() {
    const { articles, totalCount } = await getPaginatedArticles(1, 10);

    const formattedArticles = articles.map(article => ({
        ...article,
        date: article.createdAt.toLocaleDateString(),
    }));

    return (
        <ArticlesDataTable
            initialData={formattedArticles as any}
            initialTotalCount={totalCount}
        />
    );
}

export default async function ArticlesPage() {
    return (
        <div className='flex flex-1 flex-col gap-2 p-4 pt-0 '>
            <div className='flex items-center justify-between'>
                <PageTitle title='Articles' />
            </div>
            <Suspense fallback={<TableSkeleton />}>
                <ArticlesTable />
            </Suspense>
        </div>
    );
}

