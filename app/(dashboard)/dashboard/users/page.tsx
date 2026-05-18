import { getSession } from '@/app/_actions/auth-actions';
import UsersPageContent from '@/components/dashboard/users/page-content';
import { UsersSkeleton } from '@/components/skeletons/users-skeleton';
import { hasPermission, Permission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
    title: 'Users | WattUp',
    description: 'Manage team members and their roles.',
};

export default async function UsersPage() {
    const session = await getSession();
    if (!session) redirect('/admin');
    if (!hasPermission(session.role, Permission.VIEW_USERS)) redirect('/dashboard');

    return (
        <div className='flex w-full flex-col gap-6 p-4 pt-0'>
            <Suspense fallback={<UsersSkeleton />}>
                <UsersPageContent />
            </Suspense>
        </div>
    );
}
