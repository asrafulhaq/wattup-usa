/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getPaginatedArticles } from '@/app/_actions/postActions';
import { DataTable } from '@/components/data-table';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Article, ArticleBatchActions, columns } from './columns';

interface ArticlesDataTableProps {
    initialData: Article[];
    initialTotalCount: number;
}

export function ArticlesDataTable({
    initialData,
    initialTotalCount,
}: ArticlesDataTableProps) {
    const [data, setData] = useState<Article[]>(initialData);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Skip fetch on initial mount as we already have initialData
        if (
            pagination.pageIndex === 0 &&
            pagination.pageSize === 10 &&
            data === initialData
        ) {
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            const result = await getPaginatedArticles(
                pagination.pageIndex + 1,
                pagination.pageSize
            );

            const formattedArticles = result.articles.map(article => ({
                ...article,
                date: new Date(article.createdAt).toLocaleDateString(),
            })) as any[];

            setData(formattedArticles);
            setTotalCount(result.totalCount);
            setIsLoading(false);
        };
        fetchData();
    }, [pagination, initialData]);

    return (
        <div className='flex flex-1 flex-col gap-4 relative'>
            {isLoading && (
                <div className='absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-md'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
            )}
            <DataTable
                data={data}
                columns={columns}
                searchColumn='title'
                searchPlaceholder='Filter articles...'
                pageCount={Math.ceil(totalCount / pagination.pageSize)}
                paginationState={pagination}
                onPaginationChange={setPagination}
                manualPagination={true}
                actionButton={
                    <Link href='/dashboard/articles/create'>
                        <button className='flex border rounded   justify-center items-center border-border text-dark/70 hover:bg-primary transition-colors duration-300 hover:text-white gap-2 py-2 px-6'>
                            <IconPlus className='size-5' />
                            <span className='  font-normal'>Write Article</span>
                        </button>
                    </Link>
                }
                batchActions={(selectedRows, clearSelection) => (
                    <ArticleBatchActions
                        selectedRows={selectedRows}
                        clearSelection={clearSelection}
                    />
                )}
            />
        </div>
    );
}

