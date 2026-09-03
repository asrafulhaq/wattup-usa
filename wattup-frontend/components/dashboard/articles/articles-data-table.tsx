'use client';

import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { DataTable } from '@/components/data-table';
import { useTableState } from '@/components/data-table/use-table-state';
import { useArticles } from '@/hooks/use-articles';

import { Article, ArticleBatchActions, createColumns } from './columns';

/**
 * The article list.
 *
 * Was a useState plus useEffect fetch machine with its own loading flag, its own row
 * count and a guard to skip the first fetch. It is now the shape every list on this
 * dashboard uses: useTableState owns the URL, a query hook owns the data, and the shared
 * DataTable owns the rendering. The page it is on now survives a reload and can be
 * linked to, which the local state could not do.
 */
export function ArticlesDataTable({
    initialData,
    initialTotalCount,
    canPublish = false,
}: {
    initialData: Article[];
    initialTotalCount: number;
    canPublish?: boolean;
}) {
    const state = useTableState({ defaultLimit: 10 });

    // No cache seed: the page hands down rows whose dates are already formatted for
    // display, and the action returns raw ones. Seeding the cache with a different shape
    // than the query produces is how a list starts disagreeing with itself. The rendered
    // rows fall back to these until the first fetch lands, so nothing flashes.
    const { data, isPlaceholderData, isPending } = useArticles(state.page, state.limit);

    const rows = useMemo(() => {
        const articles = data?.articles ?? initialData;
        // The table wants dates it can print; the action returns Date objects.
        return articles.map(article => ({
            ...article,
            author: article.author || null,
            authorUrl: article.authorUrl || null,
            publishedAt: article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString()
                : null,
            createdAt: new Date(article.createdAt).toLocaleDateString(),
        })) as Article[];
    }, [data, initialData]);

    const total = data?.totalCount ?? initialTotalCount;
    const columns = useMemo(() => createColumns({ canPublish }), [canPublish]);

    return (
        <DataTable
            data={rows}
            columns={columns}
            searchColumn='title'
            searchPlaceholder='Filter articles...'
            isLoading={isPending}
            isStale={isPlaceholderData}
            emptyTitle='No press releases yet'
            emptyDescription='Write the first one and it will appear here.'
            manualPagination
            pageCount={Math.max(1, Math.ceil(total / state.limit))}
            paginationState={{ pageIndex: state.page - 1, pageSize: state.limit }}
            onPaginationChange={next => {
                if (next.pageSize !== state.limit) state.setLimit(next.pageSize);
                else state.setPage(next.pageIndex + 1);
            }}
            actionButton={
                <Link href='/dashboard/articles/create'>
                    <button className='flex border rounded justify-center items-center border-border text-dark/70 hover:bg-primary transition-colors duration-300 hover:text-white gap-2 py-2 px-6'>
                        <IconPlus className='size-5' />
                        <span className='font-normal'>Write Article</span>
                    </button>
                </Link>
            }
            batchActions={(selectedRows, clearSelection) => (
                <ArticleBatchActions
                    selectedRows={selectedRows}
                    clearSelection={clearSelection}
                    canPublish={canPublish}
                />
            )}
        />
    );
}
