import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getArticleByIdForDashboard } from '@/app/_actions/postActions';
import ArticleForm from '@/components/dashboard/articles/article-form';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';

async function EditWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticleByIdForDashboard(id);
    if (!article) {
        notFound();
    }
    return <ArticleForm initialData={article} />;
}

/**
 * Editing a press release.
 *
 * EDIT_ANY_POST, the permission `updateArticle` requires, so the editor opens only for
 * someone who could save what they type in it. The read below needs CREATE_POST and
 * returns nothing without it, which is the second layer.
 */
export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;

    if (!hasPermission(permissions, Permission.EDIT_ANY_POST)) {
        return <NoAccess what='press releases' role={session.role} />;
    }

    return (
        <Suspense fallback={<EditorPageSkeleton />}>
            <EditWrapper params={params} />
        </Suspense>
    );
}
