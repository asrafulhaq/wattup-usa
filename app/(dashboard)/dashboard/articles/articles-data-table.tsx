'use client';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
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
                    <Button
                        variant='outline'
                        className='flex  justify-center items-center border-border/50 text-dark/70 hover:text-white gap-2 h-8 py-6'>
                        <IconPlus className='size-5' />
                        <span className='  font-medium'>Write Article</span>
                    </Button>
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

