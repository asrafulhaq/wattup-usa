'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

/**
 * TipTap arrives after the page does, not inside it.
 *
 * SimpleEditor pulls seventeen @tiptap packages, the whole components/tiptap-* tree and
 * ProseMirror: 186 KB gzipped, plus lowlight. Statically imported it made
 * /dashboard/articles/create the heaviest route in the app at 547 KB gzipped, all of it
 * in the initial document, and the title field above it could not be typed into until
 * that had parsed.
 *
 * ssr: false costs nothing here: useEditor is already configured with
 * immediatelyRender: false, so the editor never rendered on the server anyway.
 */
const SimpleEditor = dynamic(
    () => import('@/components/tiptap-templates/simple/simple-editor').then(m => m.SimpleEditor),
    {
        ssr: false,
        loading: () => (
            <div className='space-y-2'>
                <Skeleton className='h-11 w-full rounded-md' />
                <Skeleton className='h-[420px] w-full rounded-md' />
            </div>
        ),
    }
);

interface FormEditorProps {
    title: string;
    content: string;
    onTitleChange: (value: string) => void;
    onContentChange: (value: string) => void;
}

export default function FormEditor({
    title,
    content,
    onTitleChange,
    onContentChange,
}: FormEditorProps) {
    return (
        <Card className='shadow-none border-border rounded-md'>
            <CardContent className='p-4 sm:p-6 space-y-5'>
                <div className='space-y-1.5'>
                    <Label htmlFor='title' className='text-sm font-normal'>
                        Title <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                        id='title'
                        placeholder='Enter a compelling article title…'
                        className='text-base font-normal h-11 placeholder:text-muted-foreground/50'
                        value={title}
                        onChange={e => onTitleChange(e.target.value)}
                    />
                </div>
                <Separator />
                <div className='space-y-1.5'>
                    <Label htmlFor='content' className='text-sm font-normal'>
                        Content <span className='text-destructive'>*</span>
                    </Label>

                    <SimpleEditor
                        value={content}
                        onChange={onContentChange}
                        placeholder='Start writing your story…'
                    />
                </div>
            </CardContent>
        </Card>
    );
}

