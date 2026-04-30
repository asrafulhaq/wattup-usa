import ArticleForm from '@/components/dashboard/articles/article-form';
import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton';
import { Suspense } from 'react';

export default function CreateArticlePage() {
    return (
        <Suspense fallback={<EditorPageSkeleton />}>
            <ArticleForm />
        </Suspense>
    );
}

