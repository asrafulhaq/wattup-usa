'use client';
import { DataTable } from '@/components/data-table';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { Article, ArticleBatchActions, columns } from './columns';

interface ArticlesDataTableProps {
    data: Article[];
}

export function ArticlesDataTable({ data }: ArticlesDataTableProps) {
    return (
        <DataTable
            data={data}
            columns={columns}
            searchColumn='title'
            searchPlaceholder='Filter articles...'
            actionButton={
                <Link href='/dashboard/articles/create'>
                    <button className='flex border rounded   justify-center items-center border-border text-dark/70 hover:bg-primary transition-colors duration-300 hover:text-white gap-2 py-2 px-6'>
                        <IconPlus className='size-5' />
                        <span className='  font-medium'>Write Article</span>
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
    );
}

