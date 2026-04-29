'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

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
                    <Label
                        htmlFor='title'
                        className='text-sm font-medium'>
                        Title{' '}
                        <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                        id='title'
                        placeholder='Enter a compelling article title…'
                        className='text-base font-medium h-11 placeholder:text-muted-foreground/50'
                        value={title}
                        onChange={e => onTitleChange(e.target.value)}
                    />
                </div>
                <Separator />
                <div className='space-y-1.5'>
                    <Label
                        htmlFor='content'
                        className='text-sm font-medium'>
                        Content{' '}
                        <span className='text-destructive'>*</span>
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
