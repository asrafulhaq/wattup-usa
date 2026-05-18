import { fetchUsersData } from '@/app/_actions/admin-user-actions';
import { cacheLife, cacheTag } from 'next/cache';
import { UsersClient } from './users-client';

async function UsersData() {
    'use cache';
    cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
    cacheTag('users');

    const { users, total } = await fetchUsersData(50);

    return <UsersClient users={users} total={total} />;
}

const UsersPageContent = async () => {
    return <UsersData />;
};

export default UsersPageContent;
