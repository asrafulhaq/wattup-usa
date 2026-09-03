import 'server-only';

import { requirePermission } from '@/lib/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { USERS_TAG, userTag } from '@/lib/cache-tags';
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
    cacheTag(USERS_TAG);

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
    const session = await requirePermission(Permission.VIEW_USERS);
    if (!session) return { users: [], total: 0 };
    return readUsers(pageSize);
}

// ─── One user, for the detail page ────────────────────────────────────────────

/**
 * What /dashboard/users/[id] shows in its identity section (checklist 4c.2).
 *
 * `updatedAt` is why this is not app/_actions/admin-user-actions.ts#getUserById, whose
 * ManagedUser does not carry it. The two reads otherwise overlap; this one is
 * server-only, so it is not a callable endpoint.
 */
export interface DashboardUserDetail {
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * One user by id, for a caller holding VIEW_USERS. Null both for a caller without it
 * and for an id that does not exist: the page answers notFound either way, which is
 * also the answer that tells an unauthorised caller the least.
 *
 * Deliberately uncached, unlike the list above. A permission override does not call
 * updateTag('users'), so a cached read here would keep showing a role and a ban state
 * that a grant made stale seconds ago.
 */
/**
 * The row itself, cached. The permission check stays outside, in the wrapper below: a
 * cached scope may not read headers, and the answer must not depend on who asked.
 *
 * Tagged per user and with the team list, so a role change, a ban or a delete
 * invalidates it the moment it happens. Before this the detail page re-queried on every
 * visit and the viewer watched a skeleton each time.
 */
async function readDashboardUser(userId: string): Promise<DashboardUserDetail | null> {
    'use cache';
    cacheTag(USERS_TAG, userTag(userId));
    cacheLife({ stale: 30, revalidate: 300, expire: 3600 });

    const row = await prisma.user.findUnique({
        where: { id: userId },
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
            updatedAt: true,
        },
    });
    if (!row) return null;
    return { ...row, banned: row.banned ?? false };
}

export async function getDashboardUser(userId: string): Promise<DashboardUserDetail | null> {
    const authorised = await requirePermission(Permission.VIEW_USERS);
    if (!authorised) return null;
    return readDashboardUser(userId);
}
