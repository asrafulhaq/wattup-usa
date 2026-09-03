import 'server-only';

import { POSTS_TAG } from '@/lib/cache-tags';
import { requirePermission } from '@/lib/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * The article list behind /dashboard/articles, drafts included.
 *
 * It used to be a bare findMany in app/_actions/postActions.ts with no `select` and no
 * cache, and it was the only dashboard list with neither. Two consequences, both
 * measured:
 *
 *   Every column came back, `content` among them, and those rows go straight into
 *   initialData on ArticlesDataTable. So the full HTML body of every article was
 *   serialised into the RSC payload and shipped to the browser to draw a three line
 *   excerpt: 16 894 bytes for five posts today, one of them 8 986 bytes, and growing
 *   with every article anyone writes.
 *
 *   Uncached, it cost a round trip on every visit, which is about 286ms from a dev
 *   machine to Neon us-east-1. /dashboard/articles showed 6 SQL statements in a warm
 *   trace where the cached lists showed 4.
 *
 * The shape here is the one lib/dashboard/users.ts established: a server-only module,
 * not a server action, so it is reachable only through a server render; an uncached
 * wrapper that does the permission check, because a cached scope may not read headers;
 * and the cached reader underneath, tagged POSTS_TAG. Every write in postActions.ts
 * already calls updateTag('posts'), so a create, edit, publish, duplicate or delete
 * invalidates this at the moment it happens.
 *
 * The audit that prompted this said `content` was not among the columns the table
 * renders. It is: components/dashboard/articles/columns.tsx has a Content column that
 * strips the tags and clamps the result to three lines. So the column is not dropped,
 * it is prepared here instead, which is strictly better than shipping the HTML and
 * doing the same work in the browser on every render.
 */

/** Roughly three clamped lines at the column's max width, with room to spare. */
const EXCERPT_LENGTH = 240;

/**
 * The plain text the Content column would have produced from the HTML.
 *
 * The cell's own regex still runs over this and finds no tags, so the browser draws
 * exactly what it drew before. Done here because the alternative is sending an 8 986
 * byte article body to render 240 characters of it.
 */
function excerpt(html: string | null): string {
    if (!html) return '';
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…` : text;
}

/** Exactly what components/dashboard/articles/columns.tsx reads, and nothing else. */
const LIST_COLUMNS = {
    id: true,
    title: true,
    slug: true,
    content: true,
    image: true,
    imageAlt: true,
    author: true,
    authorUrl: true,
    status: true,
    publishedAt: true,
    createdAt: true,
} as const;

export interface DashboardArticle {
    id: string;
    title: string;
    slug: string;
    content: string;
    image: string | null;
    imageAlt: string | null;
    author: string | null;
    authorUrl: string | null;
    status: string;
    publishedAt: Date | null;
    createdAt: Date;
}

export interface DashboardArticlesPage {
    articles: DashboardArticle[];
    hasNextPage: boolean;
    totalCount: number;
}

async function readDashboardArticles(
    page: number,
    pageSize: number
): Promise<DashboardArticlesPage> {
    'use cache';
    cacheTag(POSTS_TAG);
    cacheLife({ stale: 30, revalidate: 300, expire: 3600 });

    const skip = (page - 1) * pageSize;
    const [rows, totalCount] = await Promise.all([
        prisma.posts.findMany({
            skip,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
            select: LIST_COLUMNS,
        }),
        prisma.posts.count(),
    ]);

    return {
        articles: rows.map(row => ({
            ...row,
            slug: row.slug ?? '',
            content: excerpt(row.content),
        })),
        hasNextPage: skip + rows.length < totalCount,
        totalCount,
    };
}

/**
 * One page of the list for a caller holding CREATE_POST.
 *
 * Null for anyone else, and the caller decides what to do about it. postActions.ts
 * answers a refusal with the public list, so the two refusals stay indistinguishable
 * the way they were: a caller cannot tell "no session" from "no permission".
 */
export async function getDashboardArticles(
    page = 1,
    pageSize = 10
): Promise<DashboardArticlesPage | null> {
    const authorised = await requirePermission(Permission.CREATE_POST);
    if (!authorised) return null;

    try {
        return await readDashboardArticles(page, pageSize);
    } catch (error) {
        console.error('Get Dashboard Articles Error:', error);
        return { articles: [], hasNextPage: false, totalCount: 0 };
    }
}
