import { getSession } from '@/app/_actions/auth-actions';
import { getArticlesForDashboard } from '@/app/_actions/postActions';
import { ArticlesDataTable } from '@/components/dashboard/articles/articles-data-table';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { ArticlesBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function ArticlesTable() {
    const [{ articles, totalCount }, session] = await Promise.all([
        getArticlesForDashboard(1, 10),
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
        <PageShell>
            <PageHeader
                title='Articles'
                description='Write, edit and publish to the public site.'
            />
            <Suspense fallback={<ArticlesBodySkeleton />}>
                <ArticlesTable />
            </Suspense>
        </PageShell>
    );
}
