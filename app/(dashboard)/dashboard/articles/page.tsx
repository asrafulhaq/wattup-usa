/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/app/_actions/auth-actions';
import { getPaginatedArticles } from '@/app/_actions/postActions';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';
import PageTitle from '../../../../components/dashboard/page-title';
import { ArticlesDataTable } from '../../../../components/dashboard/articles/articles-data-table';

export async function ArticlesTable() {
    const [{ articles, totalCount }, session] = await Promise.all([
        getPaginatedArticles(1, 10),
        getSession(),
    ]);

    const canPublish = hasPermission(session?.role, Permission.PUBLISH_POST);

    const formattedArticles = articles.map(article => ({
        ...article,
        author: article.author || null,
        authorUrl: article.authorUrl || null,
        publishedAt: article.publishedAt
            ? article.publishedAt.toLocaleDateString()
            : null,
        createdAt: article.createdAt.toLocaleDateString(),
    }));

    return (
        <ArticlesDataTable
            initialData={formattedArticles as any}
            initialTotalCount={totalCount}
            canPublish={canPublish}
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

