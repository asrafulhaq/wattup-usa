import { getArticles } from '@/app/_actions/postActions';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Suspense } from 'react';
import PageTitle from '../components/page-title';
import { ArticlesDataTable } from './articles-data-table';

export async function ArticlesTable() {
    const articles = await getArticles();

    const formattedArticles = articles.map(article => ({
        ...article,
        date: article.createdAt.toLocaleDateString(),
    }));

    return <ArticlesDataTable data={formattedArticles as any} />;
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

