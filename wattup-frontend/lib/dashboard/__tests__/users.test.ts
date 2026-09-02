import { beforeEach, describe, expect, it, vi } from 'vitest';

const requirePermission = vi.fn();
const findUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: (args: unknown) => findUnique(args) } } }));
vi.mock('@/lib/permission-guard', () => ({
    requirePermission: (permission: string) => requirePermission(permission),
    UNAUTHORIZED: { success: false, error: 'You do not have permission to do that.' },
}));
// getDashboardUsers under the same module uses 'use cache', which needs a Next build.
// Nothing here calls it, and these two are the only Next imports the module makes.
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getDashboardUser } from '@/lib/dashboard/users';
import { Permission, Role } from '@/lib/permissions';

/**
 * The page-level read behind /dashboard/users/[id] (checklist 4c.1, 4c.2, 4c.12).
 *
 * The property: the row is never read at all unless the caller holds VIEW_USERS. A
 * check that ran after the query would leak nothing to the browser but would still
 * put the read on the wire, and the same mistake made lib/dashboard/users.ts's
 * predecessor an unauthenticated dump of the whole team.
 */

const ROW = {
    id: 'usr_7',
    name: 'Dana Reed',
    email: 'dana@wattupusa.com',
    role: Role.EDITOR,
    banned: null,
    banReason: null,
    banExpires: null,
    emailVerified: true,
    image: null,
    createdAt: new Date('2026-05-18T19:58:00Z'),
    updatedAt: new Date('2026-09-01T08:00:00Z'),
};

describe('getDashboardUser', () => {
    beforeEach(() => {
        requirePermission.mockReset();
        findUnique.mockReset();
    });

    it('is gated on VIEW_USERS, by name', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findUnique.mockResolvedValue(ROW);

        await getDashboardUser('usr_7');
        expect(requirePermission).toHaveBeenCalledWith(Permission.VIEW_USERS);
    });

    it('without the permission: null, and the row is NEVER read', async () => {
        requirePermission.mockResolvedValue(null);

        expect(await getDashboardUser('usr_7')).toBeNull();
        expect(findUnique).not.toHaveBeenCalled();
    });

    it('asks for that id and for the columns the identity section shows', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findUnique.mockResolvedValue(ROW);

        await getDashboardUser('usr_7');
        expect(findUnique).toHaveBeenCalledWith({
            where: { id: 'usr_7' },
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
    });

    it('never selects the password hash or any other column', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findUnique.mockResolvedValue(ROW);

        await getDashboardUser('usr_7');
        const select = findUnique.mock.calls[0][0].select as Record<string, boolean>;
        expect(Object.keys(select)).toHaveLength(11);
        expect(select.password).toBeUndefined();
    });

    it("a null `banned` reads as not banned, so the badge does not depend on Prisma's optional boolean", async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findUnique.mockResolvedValue(ROW);

        const user = await getDashboardUser('usr_7');
        expect(user?.banned).toBe(false);
        expect(user?.updatedAt).toEqual(new Date('2026-09-01T08:00:00Z'));
    });

    it('an id that does not exist: null, the same answer an unauthorised caller gets', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findUnique.mockResolvedValue(null);

        expect(await getDashboardUser('nobody')).toBeNull();
    });
});
