/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { getAdminSession } from './auth-actions';

export async function getArticles() {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts');
    try {
        const articles = await prisma.posts.findMany({
            orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        });
        return articles;
    } catch (error) {
        console.error('Get Articles Error:', error);
        return [];
    }
}

export async function getArticleById(id: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('posts', `post-${id}`);
    try {
        const article = await prisma.posts.findUnique({
            where: { id },
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
        const article = await prisma.posts.findUnique({
            where: { slug },
        });
        return article;
    } catch (error) {
        console.error('Get Article By Slug Error:', error);
        return null;
    }
}

export async function createArticle(data: any) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
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
                publishedAt: data.status === 'Published' ? new Date() : null,
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
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
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
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
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

export async function togglePinArticle(id: string, pinned: boolean) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    try {
        await prisma.posts.update({
            where: { id },
            data: { pinned },
        });
        updateTag('posts');
        return { success: true };
    } catch (error) {
        console.error('Toggle Pin Error:', error);
        return { success: false, error: 'Failed to update pin status' };
    }
}

export async function updateArticleStatus(id: string, status: string) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    try {
        await prisma.posts.update({
            where: { id },
            data: {
                status,
                publishedAt: status === 'Published' ? new Date() : null,
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
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };
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
                pinned: false,
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
    try {
        const articles = await prisma.posts.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    /* { content: { contains: query, mode: 'insensitive' } }, */
                ],
                status: 'Published',
            },
            take: 10, // Limit results for suggestions
        });
        return articles;
    } catch (error) {
        console.error('Search Articles Error:', error);
        return [];
    }
}

