import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Permission } from '@/lib/permissions';

const getSession = vi.fn();
const getEffectivePermissions = vi.fn();

vi.mock('@/app/_actions/auth-actions', () => ({ getSession: () => getSession() }));
vi.mock('@/lib/permissions-server', () => ({
    getEffectivePermissions: (id: string) => getEffectivePermissions(id),
}));

import { getSessionPermissions, requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';

const editor = { id: 'u-editor', email: 'editor@example.com', role: 'EDITOR', name: 'Ed', image: null };

describe('requirePermission', () => {
    beforeEach(() => {
        getSession.mockReset();
        getEffectivePermissions.mockReset();
    });

    it('allowed: returns the session and the resolved set, resolved for THAT user', async () => {
        getSession.mockResolvedValue(editor);
        getEffectivePermissions.mockResolvedValue(new Set([Permission.CREATE_POST]));

        const result = await requirePermission(Permission.CREATE_POST);

        expect(result).not.toBeNull();
        expect(result?.session).toBe(editor);
        expect(result?.permissions.has(Permission.CREATE_POST)).toBe(true);
        expect(getEffectivePermissions).toHaveBeenCalledWith('u-editor');
    });

    it('missing permission: null, even though a session exists', async () => {
        getSession.mockResolvedValue(editor);
        getEffectivePermissions.mockResolvedValue(new Set([Permission.CREATE_POST]));

        expect(await requirePermission(Permission.MANAGE_PERMISSIONS)).toBeNull();
    });

    it('no session: null, and nothing is resolved', async () => {
        getSession.mockResolvedValue(null);

        expect(await requirePermission(Permission.CREATE_POST)).toBeNull();
        expect(getEffectivePermissions).not.toHaveBeenCalled();
    });

    it('does not read the role off the session to decide', async () => {
        // A SUPER_ADMIN cookie with an empty resolved set (deleted, banned, or revoked
        // since the cookie was written) is refused: the database answers, not the cookie.
        getSession.mockResolvedValue({ ...editor, role: 'SUPER_ADMIN' });
        getEffectivePermissions.mockResolvedValue(new Set());

        expect(await requirePermission(Permission.VIEW_USERS)).toBeNull();
    });
});

describe('getSessionPermissions', () => {
    beforeEach(() => {
        getSession.mockReset();
        getEffectivePermissions.mockReset();
    });

    it('returns the pair with no permission asked of it', async () => {
        getSession.mockResolvedValue(editor);
        getEffectivePermissions.mockResolvedValue(new Set());

        const result = await getSessionPermissions();
        expect(result?.session).toBe(editor);
        expect(result?.permissions.size).toBe(0);
    });

    it('null without a session', async () => {
        getSession.mockResolvedValue(null);
        expect(await getSessionPermissions()).toBeNull();
    });
});

describe('UNAUTHORIZED', () => {
    it('is the one refusal shape and names no permission', () => {
        expect(UNAUTHORIZED).toEqual({ success: false, error: 'You do not have permission to do that.' });
    });
});
