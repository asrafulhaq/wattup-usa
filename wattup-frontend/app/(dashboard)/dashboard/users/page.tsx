import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import UsersPageContent from '@/components/dashboard/users/page-content';
import { UsersBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

export const metadata = {
    title: 'Users | WattUp',
    description: 'Manage team members and their roles.',
};

export default async function UsersPage() {
    const authorised = await getSessionPermissions();
    // Not a redirect: proxy.ts sends anyone holding a session cookie from /admin back to
    // /dashboard, so answering a rejected cookie with a redirect loops the two forever.
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;
    if (!hasPermission(permissions, Permission.VIEW_USERS)) {
        return <NoAccess what='user management' role={session.role} />;
    }

    return (
        <PageShell>
            <PageHeader
                title='Team'
                description='Who can sign in, and what each of them is allowed to change.'
            />
            <Suspense fallback={<UsersBodySkeleton />}>
                {/* The resolved set decides which controls the table draws. Every action
                    behind those controls resolves it again for itself. */}
                <UsersPageContent
                    permissions={[...permissions]}
                    currentUser={{ id: session.id, role: session.role }}
                />
            </Suspense>
        </PageShell>
    );
}
