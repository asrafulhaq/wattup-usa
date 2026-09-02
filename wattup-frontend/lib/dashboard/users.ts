import 'server-only';

import { sessionWith } from '@/app/_actions/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';
import type { ManagedUser } from '@/app/_actions/admin-user-actions';

/**
 * The team list behind /dashboard/users.
 *
 * This lived in app/_actions/admin-user-actions.ts as `fetchUsersData`, exported from a
 * 'use server' module with its permission check deliberately removed and a comment
 * saying so: the caller wrapped it in `'use cache'`, and a cached scope may not read
 * headers, so the check could not run where it was.
 *
 * Removing the check was the wrong half of that trade. Every export of a 'use server'
 * module is a callable POST endpoint, so the function became an unauthenticated way to
 * read every user's name, email, role and ban state.
 *
 * The shape here is the same one lib/locations/dashboard.ts uses: a server-only module,
 * not a server action, so it is reachable only through a server render; an uncached
 * wrapper that does the permission check, because that reads headers; and the cached
 * reader underneath it, tagged so a user write still invalidates it.
 */

async function readUsers(pageSize: number) {
    'use cache';
    cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
    cacheTag('users');

    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                banned: true,
                banReason: true,
                banExpires: true,
                emailVerified: true,
                image: true,
                createdAt: true,
            },
        }),
        prisma.user.count(),
    ]);

    return {
        users: rows.map(row => ({
            ...row,
            banned: row.banned ?? false,
        })) as unknown as ManagedUser[],
        total,
    };
}

/** Empty for a caller without VIEW_USERS, so the screen says so rather than erroring. */
export async function getDashboardUsers(
    pageSize = 50
): Promise<{ users: ManagedUser[]; total: number }> {
    const session = await sessionWith(Permission.VIEW_USERS);
    if (!session) return { users: [], total: 0 };
    return readUsers(pageSize);
}
