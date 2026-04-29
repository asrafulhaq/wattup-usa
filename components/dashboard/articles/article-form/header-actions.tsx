'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Posts } from '@prisma/client';
import { IconDeviceFloppy, IconSend } from '@tabler/icons-react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import PageTitle from '../../page-title';

interface FormHeaderProps {
    initialData?: Posts | null;
    status: string;
    isSaving: boolean;
    onSave: (publish: boolean) => void;
}

export function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        Published: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
        Draft: 'bg-amber-500/15 text-amber-600 border-amber-200',
        Archived: 'bg-zinc-500/15 text-zinc-500 border-zinc-200',
    };
    return (
        <Badge
            variant='outline'
            className={`text-[11px] font-medium px-2 py-0.5 ${map[status] ?? map['Draft']}`}>
            <span className='mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current' />
            {status}
        </Badge>
    );
}

export default function FormHeader({
    initialData,
    status,
    isSaving,
    onSave,
}: FormHeaderProps) {
    return (
        <div className='sticky top-0 z-20 -mx-2 sm:-mx-4 bg-background/90 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2 min-w-0'>
                <Link href='/dashboard/articles'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 shrink-0 rounded-md'>
                        <ChevronLeft className='h-4 w-4' />
                    </Button>
                </Link>
                <div className='min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <PageTitle
                            title={
                                initialData ? 'Edit Article' : 'Write Article'
                            }
                        />
                        {initialData && <StatusBadge status={status} />}
                    </div>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                        {initialData
                            ? 'Update your story and republish.'
                            : 'Draft your next story or insight.'}
                    </p>
                </div>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onSave(false)}
                    disabled={isSaving}
                    className='gap-2 h-9 px-4'>
                    {isSaving ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <IconDeviceFloppy size={18} />
                    )}
                    <span className='hidden sm:inline'>
                        {isSaving ? 'Saving…' : 'Save Draft'}
                    </span>
                    <span className='sm:hidden'>Draft</span>
                </Button>
                <Button
                    size='sm'
                    onClick={() => onSave(true)}
                    disabled={isSaving}
                    className='gap-2 h-9 px-4'>
                    {isSaving ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <IconSend size={18} />
                    )}
                    <span className='hidden sm:inline'>
                        {isSaving ? 'Publishing…' : 'Publish'}
                    </span>
                    <span className='sm:hidden'>Publish</span>
                </Button>
            </div>
        </div>
    );
}

