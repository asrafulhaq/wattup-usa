import { getDashboardUsers } from '@/lib/dashboard/users';
import { UsersClient } from './users-client';

/**
 * The caching now lives inside getDashboardUsers, below its permission check, rather
 * than wrapped around the whole component. A 'use cache' scope cannot read headers, so
 * a check placed out here could not run at all: that is how the reader ended up
 * unauthenticated in the first place.
 */
const UsersPageContent = async () => {
    const { users, total } = await getDashboardUsers(50);
    return <UsersClient users={users} total={total} />;
};

export default UsersPageContent;
