import { Suspense } from 'react';

import ArticleForm from '@/components/dashboard/articles/article-form';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';

/**
 * Writing a new press release.
 *
 * The page had no check of its own. `createArticle` behind it always did, so nobody
 * could actually save one, but a role without CREATE_POST could still open the editor,
 * fill it in and only then be refused, which is the worst moment to find out.
 */
export default async function CreateArticlePage() {
    const authorised = await getSessionPermissions();
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;

    if (!hasPermission(permissions, Permission.CREATE_POST)) {
        return <NoAccess what='press releases' role={session.role} />;
    }

    return (
        <Suspense fallback={<EditorPageSkeleton />}>
            <ArticleForm />
        </Suspense>
    );
}
