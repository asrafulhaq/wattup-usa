import PageContent from '@/components/dashboard/settings/page-content';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { SettingsBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

export const metadata = {
    title: 'Settings | WattUp Dashboard',
    description: 'Manage tracking codes, AEO schema, and custom scripts.',
};

export default async function SettingsPage() {
    const authorised = await getSessionPermissions();
    // Not a redirect: dropping someone on another screen with nothing said is the
    // behaviour that made this dashboard feel broken.
    if (!hasPermission(authorised?.permissions, Permission.MANAGE_SITE_SETTINGS)) {
        return <NoAccess what='site settings' role={authorised?.session.role} />;
    }

    return (
        <PageShell>
            <PageHeader
                title='Settings'
                description='Tracking codes, organisation schema, and scripts injected into every page of the public site.'
            />
            <Suspense fallback={<SettingsBodySkeleton />}>
                <PageContent />
            </Suspense>
        </PageShell>
    );
}
