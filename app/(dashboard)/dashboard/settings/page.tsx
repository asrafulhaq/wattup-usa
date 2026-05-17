import PageContent from '@/components/dashboard/settings/page-content';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';
import { Suspense } from 'react';

export const metadata = {
    title: 'Settings | WattUp Dashboard',
    description: 'Manage tracking codes, AEO schema, and custom scripts.',
};

export default async function SettingsPage() {
    return (
        <div className='flex w-full flex-col gap-6 p-4 pt-0'>
            <Suspense fallback={<SettingsSkeleton />}>
                <PageContent />
            </Suspense>
        </div>
    );
}

