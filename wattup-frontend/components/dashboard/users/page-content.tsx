import { getDashboardUsers } from '@/lib/dashboard/users';
import type { Permission, Role } from '@/lib/permissions';
import { UsersClient } from './users-client';

/**
 * The caching now lives inside getDashboardUsers, below its permission check, rather
 * than wrapped around the whole component. A 'use cache' scope cannot read headers, so
 * a check placed out here could not run at all: that is how the reader ended up
 * unauthenticated in the first place.
 *
 * `permissions` is the caller's resolved set from the page, as a plain array because it
 * crosses into a client component. It only decides what the table draws.
 */
const UsersPageContent = async ({
    permissions,
    currentUser,
}: {
    permissions: Permission[];
    currentUser: { id: string; role: Role | string };
}) => {
    const { users, total } = await getDashboardUsers(50);
    return (
        <UsersClient
            users={users}
            total={total}
            permissions={permissions}
            currentUser={currentUser}
        />
    );
};

export default UsersPageContent;
