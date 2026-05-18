/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
    deleteArticle,
    duplicateArticle,
    updateArticleStatus,
} from '@/app/_actions/postActions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconGripVertical,
    IconTrash,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { BsFileEarmarkMedical } from 'react-icons/bs';
import { toast } from 'sonner';

// ── Drag Handle ────────────────────────────────────────────────
function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id });
    return (
        <Button
            {...attributes}
            {...listeners}
            variant='ghost'
            size='icon'
            className='text-muted-foreground size-7 hover:bg-transparent cursor-grab active:cursor-grabbing'>
            <IconGripVertical className='text-muted-foreground size-3' />
            <span className='sr-only'>Drag to reorder</span>
        </Button>
    );
}

// ── Types ──────────────────────────────────────────────────────
export type Article = {
    id: string;
    title: string;
    content: string;
    slug: string;
    author?: string | null;
    authorUrl?: string | null;
    publishedAt: string | null;
    createdAt: string;
    status: string;
    image?: string | null;
    imageAlt?: string | null;
};

// ── Per-row Action Cell ────────────────────────────────────────
function ActionCell({ row }: { row: any }) {
    const article: Article = row.original;
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

    const handleDelete = async () => {
        const res = await deleteArticle(article.id);
        if (res.success) {
            toast.success('Article deleted');
            setShowDeleteDialog(false);
        } else {
            toast.error('Failed to delete');
        }
    };

    const handleDuplicate = async () => {
        const res = await duplicateArticle(article.id);
        if (res.success) toast.success('Article duplicated');
        else toast.error('Failed to duplicate');
    };

    const handleTogglePublish = async () => {
        const newStatus =
            article.status === 'Published' ? 'Draft' : 'Published';
        const res = await updateArticleStatus(article.id, newStatus);
        if (res.success)
            toast.success(
                `Article ${newStatus === 'Published' ? 'published' : 'unpublished'}`
            );
        else toast.error('Failed to update status');
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant='ghost'
                        className='data-[state=open]:bg-muted text-muted-foreground flex size-8'
                        size='icon'>
                        <IconDotsVertical className='size-4' />
                        <span className='sr-only'>Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-36 '>
                    <DropdownMenuItem asChild>
                        <Link
                            target='_blank'
                            href={`/press-release/${article.slug}`}>
                            View
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/articles/edit/${article.id}`}>
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTogglePublish}>
                        {article.status === 'Published'
                            ? 'Unpublish'
                            : 'Publish'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate}>
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() => setShowDeleteDialog(true)}>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className=''>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete this article?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className='font-normal text-foreground'>
                                &ldquo;{article.title}&rdquo;
                            </span>{' '}
                            will be permanently deleted. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant='ghost'>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            variant='destructive'>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Batch Actions (exported for use in page) ───────────────────
export function ArticleBatchActions({
    selectedRows,
    clearSelection,
}: {
    selectedRows: Article[];
    clearSelection: () => void;
}) {
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const ids = selectedRows.map(r => r.id);
    const count = ids.length;

    const handleBatchDelete = async () => {
        setIsLoading(true);
        const results = await Promise.all(ids.map(id => deleteArticle(id)));
        const failed = results.filter(r => !r.success).length;
        setIsLoading(false);
        setShowDeleteDialog(false);
        clearSelection();
        if (failed === 0)
            toast.success(`${count} article${count > 1 ? 's' : ''} deleted`);
        else toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`);
    };

    const handleBatchPublish = async () => {
        setIsLoading(true);
        await Promise.all(ids.map(id => updateArticleStatus(id, 'Published')));
        setIsLoading(false);
        clearSelection();
        toast.success(`${count} article${count > 1 ? 's' : ''} published`);
    };

    const handleBatchUnpublish = async () => {
        setIsLoading(true);
        await Promise.all(ids.map(id => updateArticleStatus(id, 'Draft')));
        setIsLoading(false);
        clearSelection();
        toast.success(`${count} article${count > 1 ? 's' : ''} set to draft`);
    };

    return (
        <>
            <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs gap-1.5'
                disabled={isLoading}
                onClick={handleBatchPublish}>
                <IconCircleCheckFilled className='size-3 fill-green-500' />
                Publish
            </Button>
            <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs gap-1.5'
                disabled={isLoading}
                onClick={handleBatchUnpublish}>
                <BsFileEarmarkMedical className='size-3' />
                Draft
            </Button>
            <Button
                size='sm'
                variant='destructive'
                className='h-7 text-xs gap-1.5'
                disabled={isLoading}
                onClick={() => setShowDeleteDialog(true)}>
                <IconTrash className='size-3' />
                Delete
            </Button>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {count} article{count > 1 ? 's' : ''}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{' '}
                            <span className='font-normal text-foreground'>
                                {count} article{count > 1 ? 's' : ''}
                            </span>
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            variant='destructive'>
                            Delete {count}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Column Definitions ─────────────────────────────────────────
export const columns: ColumnDef<Article>[] = [
    {
        id: 'drag',
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableHiding: false,
    },
    {
        id: 'select',
        header: ({ table }) => (
            <div className='flex items-center justify-center'>
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={value =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label='Select all'
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className='flex items-center justify-center'>
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={value => row.toggleSelected(!!value)}
                    aria-label='Select row'
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
            const { image, imageAlt, title, slug } = row.original;
            return (
                <div className='flex items-center gap-3'>
                    {image ? (
                        <Image
                            height={500}
                            width={500}
                            src={image}
                            alt={imageAlt || title}
                            className='h-16 w-16 rounded object-cover shrink-0 border border-border/50'
                        />
                    ) : (
                        <div className='h-10 w-16 rounded bg-muted/50 border border-border/50 shrink-0 flex items-center justify-center'>
                            <BsFileEarmarkMedical className='size-4 text-muted-foreground/40' />
                        </div>
                    )}
                    <div className='flex flex-col min-w-0'>
                        <span className='text-sm text-dark line-clamp-3 max-w-[350px] leading-relaxed whitespace-normal'>
                            {title}
                        </span>
                        <span className='text-xs text-dark/50 line-clamp-3 max-w-[350px] leading-relaxed whitespace-normal'>
                            {slug}
                        </span>
                    </div>
                </div>
            );
        },
        enableHiding: false,
    },
    {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => {
            const name = row.original.author || 'WattUp USA';
            const href = row.original.authorUrl || process.env.NEXT_PUBLIC_APP_URL || '/';
            return (
                <Link
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-muted-foreground whitespace-nowrap hover:text-foreground hover:underline underline-offset-2 transition-colors'>
                    {name}
                </Link>
            );
        },
    },
    {
        accessorKey: 'content',
        header: 'Content',
        cell: ({ row }) => {
            const plainText = (row.original.content || '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return (
                <div className='text-sm text-muted-foreground line-clamp-3 max-w-[350px] leading-relaxed whitespace-normal'>
                    {plainText}
                </div>
            );
        },
    },
    {
        accessorKey: 'publishedAt',
        header: 'Publish Date',
        cell: ({ row }) => (
            <div className='text-sm text-muted-foreground whitespace-nowrap'>
                {row.original.publishedAt ?? (
                    <span className='text-muted-foreground/50 italic'>—</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
            <div className='text-sm text-muted-foreground whitespace-nowrap'>
                {row.original.createdAt}
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge
                variant='outline'
                className='text-muted-foreground px-1.5  h-6'>
                {row.original.status === 'Published' ? (
                    <IconCircleCheckFilled className='mr-1 size-3 fill-green-500 dark:fill-green-400' />
                ) : (
                    <BsFileEarmarkMedical className='mr-1 size-3' />
                )}
                <span className='text-[10px] mt-1 font-normal'>
                    {row.original.status}
                </span>
            </Badge>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => <ActionCell row={row} />,
    },
];
