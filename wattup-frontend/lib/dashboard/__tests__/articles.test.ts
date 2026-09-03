import { beforeEach, describe, expect, it, vi } from 'vitest';

const requirePermission = vi.fn();
const findMany = vi.fn();
const count = vi.fn();

vi.mock('@/lib/prisma', () => ({
    default: {
        posts: {
            findMany: (args: unknown) => findMany(args),
            count: (args: unknown) => count(args),
        },
    },
}));
vi.mock('@/lib/permission-guard', () => ({
    requirePermission: (permission: string) => requirePermission(permission),
    UNAUTHORIZED: { success: false, error: 'You do not have permission to do that.' },
}));
// The reader under the wrapper is a 'use cache' scope, which needs a Next build. Under
// Vitest the directive is an inert string and these two are the only Next imports.
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getDashboardArticles } from '@/lib/dashboard/articles';
import { Permission } from '@/lib/permissions';

/**
 * The dashboard's article list (perf audit finding 8).
 *
 * Two properties. It is never read at all unless the caller holds CREATE_POST, the same
 * rule lib/dashboard/users.ts follows. And it never puts an article body on the wire:
 * the previous version had no `select`, so the full HTML of every article was serialised
 * into the RSC payload to draw a three line excerpt, 16 894 bytes for five posts.
 */

const LONG = `<p>${'word '.repeat(400)}</p>`;

const ROW = {
    id: 'post_1',
    title: 'A site goes live in Buena Park',
    slug: 'buena-park-live',
    content: '<h2>Headline</h2><p>Some&nbsp;body   text.</p>',
    image: null,
    imageAlt: null,
    author: 'WattUp USA',
    authorUrl: null,
    status: 'Published',
    publishedAt: new Date('2026-08-01T00:00:00Z'),
    createdAt: new Date('2026-07-30T00:00:00Z'),
};

describe('getDashboardArticles', () => {
    beforeEach(() => {
        requirePermission.mockReset();
        findMany.mockReset();
        count.mockReset();
        findMany.mockResolvedValue([ROW]);
        count.mockResolvedValue(1);
    });

    it('is gated on CREATE_POST, by name', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });

        await getDashboardArticles();

        expect(requirePermission).toHaveBeenCalledWith(Permission.CREATE_POST);
    });

    it('answers null without the permission, and never runs the query', async () => {
        requirePermission.mockResolvedValue(null);

        expect(await getDashboardArticles()).toBeNull();
        expect(findMany).not.toHaveBeenCalled();
        expect(count).not.toHaveBeenCalled();
    });

    it('selects columns rather than the whole row', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });

        await getDashboardArticles(1, 10);

        const args = findMany.mock.calls[0][0] as { select?: Record<string, boolean> };
        expect(args.select, 'no select: the whole row ships to the browser').toBeDefined();
        // featured, featuredImage and updatedAt are read by nothing on this screen.
        for (const column of ['featured', 'featuredImage', 'updatedAt']) {
            expect(args.select).not.toHaveProperty(column);
        }
        for (const column of ['id', 'title', 'slug', 'status', 'createdAt']) {
            expect(args.select).toHaveProperty(column, true);
        }
    });

    it('sends an excerpt, not the article body', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findMany.mockResolvedValue([{ ...ROW, content: LONG }]);

        const result = await getDashboardArticles();
        const content = result!.articles[0].content;

        expect(content).not.toContain('<');
        expect(content.length).toBeLessThan(260);
        expect(LONG.length).toBeGreaterThan(1000);
    });

    it('strips the tags and the entities the Content column would have stripped', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });

        const result = await getDashboardArticles();

        expect(result!.articles[0].content).toBe('Headline Some body text.');
    });

    it('reads null content as an empty excerpt rather than throwing', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findMany.mockResolvedValue([{ ...ROW, content: null, slug: null }]);

        const result = await getDashboardArticles();

        expect(result!.articles[0].content).toBe('');
        expect(result!.articles[0].slug).toBe('');
    });

    it('pages, and reports whether there is a next one', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findMany.mockResolvedValue([ROW, ROW]);
        count.mockResolvedValue(9);

        const result = await getDashboardArticles(2, 2);

        expect(findMany.mock.calls[0][0]).toMatchObject({ skip: 2, take: 2 });
        expect(result).toMatchObject({ hasNextPage: true, totalCount: 9 });
    });

    it('the last page reports no next one', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });
        findMany.mockResolvedValue([ROW]);
        count.mockResolvedValue(3);

        expect((await getDashboardArticles(3, 1))!.hasNextPage).toBe(false);
    });

    it('an unfiltered count: the dashboard list includes drafts, so the total must too', async () => {
        requirePermission.mockResolvedValue({ session: { id: 'a' }, permissions: new Set() });

        await getDashboardArticles();

        expect(count).toHaveBeenCalledWith(undefined);
        expect(findMany.mock.calls[0][0]).not.toHaveProperty('where');
    });
});
