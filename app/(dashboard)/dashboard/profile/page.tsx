import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton';
import { Suspense } from 'react';
import PageTitle from '../../../../components/dashboard/page-title';
import PageContent from '../../../../components/dashboard/profile/page-content';

export default async function ProfilePage() {
    return (
        <div className='flex w-full flex-col gap-6 p-4 pt-0 '>
            <div className='flex items-center justify-between w-full'>
                <PageTitle title='Profile Settings' />
            </div>

            <Suspense fallback={<ProfileSkeleton />}>
                <PageContent />
            </Suspense>
        </div>
    );
}

