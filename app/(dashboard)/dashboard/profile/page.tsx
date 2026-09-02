import PageContent from '@/components/dashboard/profile/page-content';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton';
import { Suspense } from 'react';

export const metadata = {
    title: 'Profile | WattUp Dashboard',
    description: 'Your account, photo and sign-in details.',
};

export default async function ProfilePage() {
    return (
        <PageShell>
            <PageHeader
                title='Profile'
                description='Your name, photo and sign-in details. These show on any article you publish.'
            />
            <Suspense fallback={<ProfileSkeleton />}>
                <PageContent />
            </Suspense>
        </PageShell>
    );
}
