import { getArticleById } from '@/app/_actions/postActions';
import ArticleForm from '@/components/dashboard/articles/article-form';
import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function EditWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) {
        notFound();
    }
    return <ArticleForm initialData={article} />;
}

export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense fallback={<EditorPageSkeleton />}>
            <EditWrapper params={params} />
        </Suspense>
    );
}

