/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { getDashboardArticles } from '@/lib/dashboard/articles';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';

/**
 * The only rows a public read may return.
 *
 * Every read below that does not check a session applies this inside the Prisma query,
 * never at the call site. These exports are 'use server' functions, which makes each one
 * an HTTP endpoint anyone can call, so a filter the caller is trusted to pass is a filter
 * that can be left out. lib/locations/server.ts applies the same rule with published: true.
 */
const PUBLISHED = { status: 'Published' } as const;

/**
 * Every write below gates itself on a post permission resolved for this request
 * (finding F3, checklist 4a.13): CREATE_POST to create or duplicate, EDIT_ANY_POST to
 * edit, DELETE_ANY_POST to delete, PUBLISH_POST to change status. The *_OWN_POST pair
 * is deliberately not checked: Posts.author is free text with no relation to User, so
 * "own" cannot be evaluated (ADR 0002 section 7, client ask I).
 *
 * A create or edit that would publish is a publish, whatever endpoint it arrives on, so
 * those two also require PUBLISH_POST when the incoming status is Published.
 */
const PUBLISHING = 'Published';

export async function getArticles(page = 1, pageSize = 10) {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts');
    try {
        const skip = (page - 1) * pageSize;
        const articles = await prisma.posts.findMany({
            skip,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
            where: PUBLISHED,
        });
        return articles;
    } catch (error) {
        console.error('Get Articles Error:', error);
        return [];
    }
}

export async function getPaginatedArticles(page = 1, pageSize = 10) {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts');
    try {
        const skip = (page - 1) * pageSize;
        const [articles, totalCount] = await Promise.all([
            prisma.posts.findMany({
                skip,
                take: pageSize,
                orderBy: [{ createdAt: 'desc' }],
                where: PUBLISHED,
            }),
            prisma.posts.count({ where: PUBLISHED }),
        ]);

        return {
            articles,
            hasNextPage: skip + articles.length < totalCount,
            totalCount,
        };
    } catch (error) {
        console.error('Get Paginated Articles Error:', error);
        return { articles: [], hasNextPage: false, totalCount: 0 };
    }
}

export async function getArticleById(id: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts', `post-${id}`);
    try {
        const article = await prisma.posts.findFirst({
            where: { id, ...PUBLISHED },
        });
        return article;
    } catch (error) {
        console.error('Get Article Error:', error);
        return null;
    }
}

export async function getArticleBySlug(slug: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts', `post-${slug}`);
    try {
        const article = await prisma.posts.findFirst({
            where: { slug, ...PUBLISHED },
        });
        return article;
    } catch (error) {
        console.error('Get Article By Slug Error:', error);
        return null;
    }
}

/**
 * The dashboard's list: drafts included, for a signed-in user holding CREATE_POST.
 *
 * The read itself now lives in lib/dashboard/articles.ts, in the shape the rest of this
 * dashboard uses: a server-only module with an uncached wrapper doing the permission
 * check and a cached reader under it tagged POSTS_TAG. This export stays because it is
 * the endpoint hooks/use-articles.ts calls, and it is listed in lib/permission-inventory.
 *
 * The comment that used to sit here said the read could not be cached, because a cached
 * result is keyed on its arguments rather than on who is asking, so one signed-in request
 * would put the drafts in the cache and the next anonymous request would read them out.
 * That reasoning is right about a cache wrapped AROUND the check, and it is why the check
 * stays out here: what changed is that the reader underneath it is cached separately, so
 * every caller still pays for their own permission resolution and only the rows are
 * shared. The rows are the same for everyone entitled to see them.
 *
 * Without a session, or without the permission, the caller gets exactly what the public
 * site shows, by going through getPaginatedArticles, so there is one definition of
 * "public" rather than two. The two refusals are indistinguishable on purpose.
 *
 * The permission is checked here AND inside getDashboardArticles, deliberately. The
 * reader guards itself because a page can import it directly, and this endpoint guards
 * itself because lib/permission-inventory.ts records what it takes to call this URL and
 * a test proves the code backs the claim: a guard one module away is a guard a reader of
 * this file cannot see. It costs nothing, because getSession and the permission
 * resolution are both memoised for the request, so the second call issues no query.
 */
export async function getArticlesForDashboard(page = 1, pageSize = 10) {
    const authorised = await requirePermission(Permission.CREATE_POST);
    if (!authorised) return getPaginatedArticles(page, pageSize);

    const forTheTeam = await getDashboardArticles(page, pageSize);
    return forTheTeam ?? getPaginatedArticles(page, pageSize);
}

/**
 * One article for the editor, draft or published, for a signed-in user holding
 * CREATE_POST. Uncached for the reason given on getArticlesForDashboard.
 */
export async function getArticleByIdForDashboard(id: string) {
    const authorised = await requirePermission(Permission.CREATE_POST);
    if (!authorised) {
        return getArticleById(id);
    }

    try {
        return await prisma.posts.findUnique({ where: { id } });
    } catch (error) {
        console.error('Get Article For Dashboard Error:', error);
        return null;
    }
}

export async function createArticle(data: any) {
    const authorised = await requirePermission(Permission.CREATE_POST);
    if (!authorised) return UNAUTHORIZED;
    if (data?.status === PUBLISHING && !hasPermission(authorised.permissions, Permission.PUBLISH_POST)) {
        return { success: false, error: 'You do not have permission to publish. Save it as a draft.' };
    }
    try {
        const slug =
            data.slug ||
            data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

        const article = await prisma.posts.create({
            data: {
                ...data,
                slug,
                publishedAt:
                    data.publishedAt instanceof Date
                        ? data.publishedAt
                        : data.status === PUBLISHING
                          ? new Date()
                          : null,
            },
        });

        updateTag('posts');
        return { success: true, data: article };
    } catch (error: any) {
        console.error('Create Article Error:', error);
        if (
            error.code === 'P2002' ||
            error.message?.includes('Unique constraint failed')
        ) {
            if (error.message?.includes('slug')) {
                return {
                    success: false,
                    error: 'Article with this slug already exists. Please choose a different slug.',
                };
            }
            return {
                success: false,
                error: 'A unique constraint failed. Please check your data.',
            };
        }
        return {
            success: false,
            error: 'Failed to create article. Please try again.',
        };
    }
}

export async function updateArticle(id: string, data: any) {
    const authorised = await requirePermission(Permission.EDIT_ANY_POST);
    if (!authorised) return UNAUTHORIZED;
    if (data?.status === PUBLISHING && !hasPermission(authorised.permissions, Permission.PUBLISH_POST)) {
        return { success: false, error: 'You do not have permission to publish. Save it as a draft.' };
    }
    try {
        const slug =
            data.slug ||
            data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

        const article = await prisma.posts.update({
            where: { id },
            data: {
                ...data,
                slug,
                updatedAt: new Date(),
            },
        });

        updateTag('posts');
        return { success: true, data: article };
    } catch (error: any) {
        console.error('Update Article Error:', error);
        if (
            error.code === 'P2002' ||
            error.message?.includes('Unique constraint failed')
        ) {
            if (error.message?.includes('slug')) {
                return {
                    success: false,
                    error: 'Article with this slug already exists. Please choose a different slug.',
                };
            }
            return {
                success: false,
                error: 'A unique constraint failed. Please check your data.',
            };
        }
        return {
            success: false,
            error: 'Failed to update article. Please try again.',
        };
    }
}

export async function deleteArticle(id: string) {
    const authorised = await requirePermission(Permission.DELETE_ANY_POST);
    if (!authorised) return UNAUTHORIZED;
    try {
        await prisma.posts.delete({
            where: { id },
        });
        updateTag('posts');
        return { success: true };
    } catch (error) {
        console.error('Delete Article Error:', error);
        return { success: false, error: 'Failed to delete article' };
    }
}


export async function updateArticleStatus(id: string, status: string) {
    const authorised = await requirePermission(Permission.PUBLISH_POST);
    if (!authorised) return UNAUTHORIZED;
    try {
        await prisma.posts.update({
            where: { id },
            data: {
                status,
                publishedAt: status === PUBLISHING ? new Date() : null,
            },
        });
        updateTag('posts');

        return { success: true };
    } catch (error) {
        console.error('Update Status Error:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

export async function duplicateArticle(id: string) {
    const authorised = await requirePermission(Permission.CREATE_POST);
    if (!authorised) return UNAUTHORIZED;
    try {
        const article = await prisma.posts.findUnique({
            where: { id },
        });

        if (!article) return { success: false, error: 'Article not found' };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, createdAt: __, updatedAt: ___, ...rest } = article;

        const newTitle = `${rest.title} (Copy)`;
        const newSlug = `${rest.slug}-copy-${Date.now()}`;

        await prisma.posts.create({
            data: {
                ...rest,
                featuredImage: rest.featuredImage ?? undefined,
                title: newTitle,
                slug: newSlug,
                status: 'Draft',
            } as any,
        });
        updateTag('posts');
        return { success: true };
    } catch (error) {
        console.error('Duplicate Article Error:', error);
        return { success: false, error: 'Failed to duplicate article' };
    }
}

export async function searchArticles(query: string) {
    'use cache';
    cacheLife('minutes');
    // Tagged with the rest of the post reads (backlog B.8), so a publish or unpublish
    // shows in search suggestions at the same moment it shows in the list.
    cacheTag('posts');
    try {
        const articles = await prisma.posts.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    /* { content: { contains: query, mode: 'insensitive' } }, */
                ],
                status: PUBLISHING,
            },
            take: 10, // Limit results for suggestions
        });
        return articles;
    } catch (error) {
        console.error('Search Articles Error:', error);
        return [];
    }
}
