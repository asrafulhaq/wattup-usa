import { describe, expect, it } from 'vitest';

import { ALLOWED_UPLOAD_FOLDERS, isOwnedPublicId } from '@/lib/image-service';

/**
 * Checklist S.1.10, finding F17. `DELETE_MEDIA` says a person may delete this site's
 * media. It does not say they may delete anything that happens to share the Cloudinary
 * account, and the audit found that account holds 1,360 assets belonging to other live
 * products. isOwnedPublicId is the boundary between the two.
 */
describe('isOwnedPublicId', () => {
    it('accepts an id directly inside each allowed folder', () => {
        for (const folder of ALLOWED_UPLOAD_FOLDERS) {
            expect(isOwnedPublicId(`${folder}/abc123`), folder).toBe(true);
        }
    });

    it('accepts a nested path inside an allowed folder', () => {
        // Cloudinary allows deeper paths, and an upload to `articles` can produce one.
        expect(isOwnedPublicId('articles/2026/09/hero-image')).toBe(true);
    });

    it.each([
        ['islandtours/users/abc/photo', 'another live product in the same cloud'],
        ['wp-migration/catamaran/img', 'a WordPress export belonging to someone else'],
        ['tripwheel/klein-curacao', 'a third product'],
        ['team-members/member-xyz', 'another app'],
        ['estimator-avatars/a', 'another app'],
        ['sample', 'a bare id at the account root, which Cloudinary ships by default'],
        ['cld-sample-3', 'another of Cloudinary own samples'],
    ])('refuses %s (%s)', (id) => {
        expect(isOwnedPublicId(id)).toBe(false);
    });

    it.each([
        ['articles/../islandtours/photo', 'climbing out with ..'],
        ['../articles/photo', 'leading ..'],
        ['/articles/photo', 'an absolute path'],
        ['https://res.cloudinary.com/x/articles/y', 'a whole URL'],
        ['articles', 'the folder itself, with no id'],
        ['', 'the empty string'],
    ])('refuses %s (%s)', (id) => {
        expect(isOwnedPublicId(id)).toBe(false);
    });

    it.each([undefined, null, 0, 1, {}, [], true, () => {}])('refuses the non-string %s', (v) => {
        expect(isOwnedPublicId(v)).toBe(false);
    });

    it('matches on the whole first segment, never a prefix', () => {
        // 'articles-of-someone-else' starts with 'articles' but is a different folder.
        expect(isOwnedPublicId('articles-of-someone-else/photo')).toBe(false);
        expect(isOwnedPublicId('locations-old/photo')).toBe(false);
    });
});
