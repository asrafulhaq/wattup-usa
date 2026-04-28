import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton';
import { Suspense } from 'react';
import ArticleForm from '../components/article-form';

export default function CreateArticlePage() {
    return (
        <Suspense fallback={<EditorPageSkeleton />}>
            <ArticleForm />
        </Suspense>
    );
}

