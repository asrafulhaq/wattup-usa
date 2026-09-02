import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Permission } from '@/lib/permissions';

/**
 * The containment boundary on the media actions: checklist S.1.10, finding F17.
 *
 * The permission half was done in 4a (`DELETE_MEDIA` to delete, `UPLOAD_MEDIA` to upload
 * or move). What these tests pin is the half the permission cannot express: the Cloudinary
 * account is shared with other live products, so an authorised caller must still not be
 * able to reach an asset outside this app's own folders by passing its public id.
 *
 * Every assertion is on the arguments the Cloudinary stub received, or on it having
 * received nothing at all, which is the point.
 */

const { cloudinary, requirePermission } = vi.hoisted(() => ({
    cloudinary: {
        deleteImagesFromCloudinary: vi.fn(),
        deleteSingleImageFromCloudinary: vi.fn(),
        moveImageInCloudinary: vi.fn(),
        uploadImageToCloudinary: vi.fn(),
    },
    requirePermission: vi.fn(),
}));

vi.mock('@/lib/image-service', async () => {
    // The folder list and both predicates are the real ones: stubbing them would make the
    // test agree with itself rather than with the code.
    const actual = await vi.importActual<typeof import('@/lib/image-service')>('@/lib/image-service');
    return { ...actual, ...cloudinary };
});

vi.mock('@/lib/permission-guard', async () => {
    const actual = await vi.importActual<typeof import('@/lib/permission-guard')>('@/lib/permission-guard');
    return { ...actual, requirePermission: (p: Permission) => requirePermission(p) };
});

// permission-guard pulls in lib/auth.ts, which constructs a Resend client at module load
// and throws without an API key. Nothing here sends mail, so both are stubbed, the same way
// admin-user-actions.test.ts does it.
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: { api: {} } }));
vi.mock('@/lib/prisma', () => ({ default: {} }));

const AUTHORISED = { session: { id: 'u1', email: 'someone@wattupusa.com' }, permissions: new Set() };

let actions: typeof import('@/app/_actions/image-actions');

beforeEach(async () => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue(AUTHORISED);
    actions ??= await import('@/app/_actions/image-actions');
});

describe('deleteSingleImage', () => {
    it('deletes an id inside this app\'s folders, passing it through unchanged', async () => {
        cloudinary.deleteSingleImageFromCloudinary.mockResolvedValue({ result: 'ok' });

        const result = await actions.deleteSingleImage('articles/hero-abc');

        expect(cloudinary.deleteSingleImageFromCloudinary).toHaveBeenCalledWith('articles/hero-abc');
        expect(result).toEqual({ success: true, result: { result: 'ok' } });
    });

    it('refuses an id belonging to another product in the same cloud, and calls Cloudinary not at all', async () => {
        const result = await actions.deleteSingleImage('islandtours/users/42/photo');

        expect(cloudinary.deleteSingleImageFromCloudinary).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, error: 'That image does not belong to this site' });
    });

    it('checks the permission before the boundary, so an unauthorised caller learns nothing about it', async () => {
        requirePermission.mockResolvedValue(null);

        const result = await actions.deleteSingleImage('articles/hero-abc');

        expect(requirePermission).toHaveBeenCalledWith(Permission.DELETE_MEDIA);
        expect(cloudinary.deleteSingleImageFromCloudinary).not.toHaveBeenCalled();
        expect(result).not.toEqual({ success: false, error: 'That image does not belong to this site' });
    });
});

describe('deleteImages', () => {
    it('deletes a batch that is entirely ours', async () => {
        cloudinary.deleteImagesFromCloudinary.mockResolvedValue({ deleted: 2 });

        const result = await actions.deleteImages(['articles/a', 'locations/b']);

        expect(cloudinary.deleteImagesFromCloudinary).toHaveBeenCalledWith(['articles/a', 'locations/b']);
        expect(result).toMatchObject({ success: true });
    });

    it('refuses the whole batch when one id is foreign, rather than deleting the rest', async () => {
        const result = await actions.deleteImages(['articles/a', 'islandtours/sneaky', 'locations/b']);

        expect(cloudinary.deleteImagesFromCloudinary).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, error: 'Those images do not belong to this site' });
    });

    it('refuses an empty or non-array argument without reaching Cloudinary', async () => {
        for (const bad of [[], undefined, null, 'articles/a']) {
            const result = await actions.deleteImages(bad as never);
            expect(result).toEqual({ success: false, error: 'No images given' });
        }
        expect(cloudinary.deleteImagesFromCloudinary).not.toHaveBeenCalled();
    });
});

describe('moveImage', () => {
    it('moves an id of ours into an allowed folder', async () => {
        cloudinary.moveImageInCloudinary.mockResolvedValue({ public_id: 'articles/a', secure_url: 'https://x/a' });

        const result = await actions.moveImage('drafts/a', 'articles');

        expect(cloudinary.moveImageInCloudinary).toHaveBeenCalledWith('drafts/a', 'articles');
        expect(result).toMatchObject({ success: true, data: { id: 'articles/a' } });
    });

    it('refuses a foreign source, which would otherwise copy another product\'s asset into ours', async () => {
        const result = await actions.moveImage('islandtours/nice-photo', 'articles');

        expect(cloudinary.moveImageInCloudinary).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, error: 'That image does not belong to this site' });
    });

    it('still refuses a destination outside the allowed folders', async () => {
        const result = await actions.moveImage('drafts/a', 'islandtours');

        expect(cloudinary.moveImageInCloudinary).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, error: 'Invalid folder' });
    });
});
