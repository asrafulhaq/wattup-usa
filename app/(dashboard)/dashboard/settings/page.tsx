import { getSession } from '@/app/_actions/auth-actions';
import PageContent from '@/components/dashboard/settings/page-content';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';
import { hasPermission, Permission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
    title: 'Settings | WattUp Dashboard',
    description: 'Manage tracking codes, AEO schema, and custom scripts.',
};

export default async function SettingsPage() {
    const session = await getSession();
    if (!hasPermission(session?.role, Permission.MANAGE_SITE_SETTINGS)) {
        redirect('/dashboard');
    }

    return (
        <div className='flex w-full flex-col gap-6 p-4 pt-0'>
            <Suspense fallback={<SettingsSkeleton />}>
                <PageContent />
            </Suspense>
        </div>
    );
}

