import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Permission, Role } from '@/lib/permissions';

const getSession = vi.fn();
const getEffectivePermissions = vi.fn();
const resolvePermissionsForKnownUser = vi.fn();

vi.mock('@/app/_actions/auth-actions', () => ({ getSession: () => getSession() }));
vi.mock('@/lib/permissions-server', () => ({
    getEffectivePermissions: (id: string) => getEffectivePermissions(id),
    resolvePermissionsForKnownUser: (user: unknown) => resolvePermissionsForKnownUser(user),
}));

import { getSessionPermissions, requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';

const editor = {
    id: 'u-editor',
    email: 'editor@example.com',
    role: 'EDITOR',
    name: 'Ed',
    image: null,
    banned: false,
    banExpires: null,
};

function resetAll() {
    getSession.mockReset();
    getEffectivePermissions.mockReset();
    resolvePermissionsForKnownUser.mockReset();
}

describe('requirePermission', () => {
    beforeEach(resetAll);

    it('allowed: returns the session and the resolved set, resolved for THAT user', async () => {
        getSession.mockResolvedValue(editor);
        resolvePermissionsForKnownUser.mockResolvedValue(new Set([Permission.CREATE_POST]));

        const result = await requirePermission(Permission.CREATE_POST);

        expect(result).not.toBeNull();
        expect(result?.session).toBe(editor);
        expect(result?.permissions.has(Permission.CREATE_POST)).toBe(true);
        expect(resolvePermissionsForKnownUser).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'u-editor' })
        );
    });

    it('missing permission: null, even though a session exists', async () => {
        getSession.mockResolvedValue(editor);
        resolvePermissionsForKnownUser.mockResolvedValue(new Set([Permission.CREATE_POST]));

        expect(await requirePermission(Permission.MANAGE_PERMISSIONS)).toBeNull();
    });

    it('no session: null, and nothing is resolved', async () => {
        getSession.mockResolvedValue(null);

        expect(await requirePermission(Permission.CREATE_POST)).toBeNull();
        expect(resolvePermissionsForKnownUser).not.toHaveBeenCalled();
        expect(getEffectivePermissions).not.toHaveBeenCalled();
    });

    it('does not read the role off the session to decide', async () => {
        // A SUPER_ADMIN cookie with an empty resolved set (deleted, banned, or revoked
        // since the cookie was written) is refused: the database answers, not the cookie.
        getSession.mockResolvedValue({ ...editor, role: 'SUPER_ADMIN' });
        resolvePermissionsForKnownUser.mockResolvedValue(new Set());

        expect(await requirePermission(Permission.VIEW_USERS)).toBeNull();
    });
});

describe('getSessionPermissions', () => {
    beforeEach(resetAll);

    it('returns the pair with no permission asked of it', async () => {
        getSession.mockResolvedValue(editor);
        resolvePermissionsForKnownUser.mockResolvedValue(new Set());

        const result = await getSessionPermissions();
        expect(result?.session).toBe(editor);
        expect(result?.permissions.size).toBe(0);
    });

    it('null without a session', async () => {
        getSession.mockResolvedValue(null);
        expect(await getSessionPermissions()).toBeNull();
    });
});

/**
 * Perf audit finding 1. Better Auth's session read already returned this user's role and
 * ban state, and the resolver used to select the same three columns of the same row a
 * second time, 273ms later, for a fourth sequential round trip that did no work. The
 * guard now hands the row it has to resolvePermissionsForKnownUser.
 *
 * What must stay true: the ban state travels with the row rather than being dropped, an
 * unrecognised role never guesses, and no permission answer is taken from the cookie.
 */
describe('the resolver the guard chooses', () => {
    beforeEach(resetAll);

    it('hands the known row to the resolver, and does not re-read the user', async () => {
        const banExpires = new Date('2030-01-01T00:00:00.000Z');
        getSession.mockResolvedValue({ ...editor, banned: true, banExpires });
        resolvePermissionsForKnownUser.mockResolvedValue(new Set());

        await getSessionPermissions();

        expect(resolvePermissionsForKnownUser).toHaveBeenCalledWith({
            id: 'u-editor',
            role: Role.EDITOR,
            banned: true,
            banExpires,
        });
        expect(getEffectivePermissions).not.toHaveBeenCalled();
    });

    it('falls back to the reading resolver when the role is not one this build knows', async () => {
        // A role added to the database ahead of lib/permissions.ts. Guessing at it would
        // be an authorisation decision made from an unknown string, so it pays the read.
        getSession.mockResolvedValue({ ...editor, role: 'FUTURE_ROLE' });
        getEffectivePermissions.mockResolvedValue(new Set([Permission.CREATE_POST]));

        const result = await getSessionPermissions();

        expect(getEffectivePermissions).toHaveBeenCalledWith('u-editor');
        expect(resolvePermissionsForKnownUser).not.toHaveBeenCalled();
        expect(result?.permissions.has(Permission.CREATE_POST)).toBe(true);
    });

    it('falls back for an empty or absent role rather than treating it as a known one', async () => {
        for (const role of ['', 'toString', 'undefined']) {
            resetAll();
            getSession.mockResolvedValue({ ...editor, role });
            getEffectivePermissions.mockResolvedValue(new Set());

            await getSessionPermissions();

            expect(getEffectivePermissions).toHaveBeenCalledWith('u-editor');
            expect(resolvePermissionsForKnownUser).not.toHaveBeenCalled();
        }
    });

    it('returns exactly what the resolver answered, never a set derived from the role', async () => {
        // The cookie says SUPER_ADMIN; the resolver says one permission. The guard must
        // report the resolver's answer, so a revoked or banned account is refused.
        getSession.mockResolvedValue({ ...editor, role: 'SUPER_ADMIN' });
        resolvePermissionsForKnownUser.mockResolvedValue(new Set([Permission.CREATE_POST]));

        const result = await getSessionPermissions();

        expect([...(result?.permissions ?? [])]).toEqual([Permission.CREATE_POST]);
    });
});

describe('UNAUTHORIZED', () => {
    it('is the one refusal shape and names no permission', () => {
        expect(UNAUTHORIZED).toEqual({ success: false, error: 'You do not have permission to do that.' });
    });
});
