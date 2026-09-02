'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Link2, Link2Off } from 'lucide-react';
import { useState } from 'react';

interface FormMetadataProps {
    slug: string;
    status: string;
    author: string;
    authorUrl: string;
    publishedAt: string;
    onSlugChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onAuthorChange: (value: string) => void;
    onAuthorUrlChange: (value: string) => void;
    onPublishedAtChange: (value: string) => void;
}

export default function FormMetadata({
    slug,
    status,
    author,
    authorUrl,
    publishedAt,
    onSlugChange,
    onStatusChange,
    onAuthorChange,
    onAuthorUrlChange,
    onPublishedAtChange,
}: FormMetadataProps) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [localUrl, setLocalUrl] = useState('');

    const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const handleLinkOpen = (open: boolean) => {
        if (open) setLocalUrl(authorUrl || defaultUrl);
        setLinkOpen(open);
    };

    const handleLinkSave = () => {
        onAuthorUrlChange(localUrl.trim());
        setLinkOpen(false);
    };

    const handleLinkRemove = () => {
        onAuthorUrlChange('');
        setLocalUrl('');
        setLinkOpen(false);
    };

    // Parse as local midnight to avoid UTC offset shifting the day back
    const dateValue = publishedAt ? new Date(publishedAt + 'T00:00:00') : undefined;

    const handleDateChange = (date: Date | undefined) => {
        if (!date) { onPublishedAtChange(''); return; }
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        onPublishedAtChange(`${y}-${m}-${d}`);
    };

    return (
        <Card className='shadow-none border-border rounded-md'>
            <CardContent className='p-3'>
                <div className='flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center'>
                    {/* Slug */}
                    <div className='flex items-center gap-2 md:flex-[2] md:min-w-0'>
                        <Label
                            htmlFor='slug'
                            className='text-xs text-muted-foreground whitespace-nowrap w-20 shrink-0 md:w-auto'>
                            Slug
                        </Label>
                        <Input
                            id='slug'
                            value={slug}
                            onChange={e => onSlugChange(e.target.value)}
                            placeholder='article-url-slug'
                            className='h-8 border border-border text-xs font-mono bg-muted/30 flex-1 min-w-0'
                        />
                    </div>

                    {/* Status */}
                    <div className='flex items-center gap-2'>
                        <Label
                            htmlFor='status'
                            className='text-xs text-muted-foreground whitespace-nowrap w-20 shrink-0 md:w-auto'>
                            Status
                        </Label>
                        <Select value={status} onValueChange={onStatusChange}>
                            <SelectTrigger id='status' className='h-8 w-full md:w-32 text-xs'>
                                <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    { value: 'Draft', color: 'bg-amber-500' },
                                    { value: 'Published', color: 'bg-emerald-500' },
                                    { value: 'Archived', color: 'bg-zinc-400' },
                                ].map(({ value, color }) => (
                                    <SelectItem key={value} value={value} className='text-xs'>
                                        <span className='flex items-center gap-2'>
                                            <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                                            {value}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Author + link icon */}
                    <div className='flex items-center gap-2 md:flex-1 md:min-w-0'>
                        <Label
                            htmlFor='author'
                            className='text-xs text-muted-foreground whitespace-nowrap w-20 shrink-0 md:w-auto'>
                            Author
                        </Label>
                        <div className='flex items-center flex-1 min-w-0 relative'>
                            <Input
                                id='author'
                                value={author}
                                onChange={e => onAuthorChange(e.target.value)}
                                placeholder='Author name'
                                className='h-8 border border-border text-xs bg-muted/30 flex-1 min-w-0 pr-8'
                            />
                            {author && (
                                <Popover open={linkOpen} onOpenChange={handleLinkOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='icon'
                                            className='absolute right-0.5 h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground'>
                                            {authorUrl
                                                ? <Link2 className='h-3.5 w-3.5 text-foreground' />
                                                : <Link2 className='h-3.5 w-3.5' />
                                            }
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-72 p-3'
                                        align='end'
                                        side='bottom'>
                                        <div className='flex flex-col gap-3'>
                                            <div>
                                                <p className='text-xs font-medium mb-0.5'>Author link</p>
                                                <p className='text-[11px] text-muted-foreground leading-relaxed'>
                                                    Readers will see the author name as a clickable link. Leave blank to show plain text. Defaults to your site URL.
                                                </p>
                                            </div>
                                            <Input
                                                value={localUrl}
                                                onChange={e => setLocalUrl(e.target.value)}
                                                placeholder={defaultUrl || 'https://example.com'}
                                                className='h-8 text-xs font-mono'
                                            />
                                            <div className='flex items-center gap-2'>
                                                <Button
                                                    size='sm'
                                                    className='h-7 text-xs flex-1'
                                                    onClick={handleLinkSave}>
                                                    Save
                                                </Button>
                                                {authorUrl && (
                                                    <Button
                                                        size='sm'
                                                        variant='outline'
                                                        className='h-7 text-xs gap-1'
                                                        onClick={handleLinkRemove}>
                                                        <Link2Off className='h-3 w-3' />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>

                    {/* Publish Date */}
                    <div className='flex items-center gap-2'>
                        <Label className='text-xs text-muted-foreground whitespace-nowrap w-20 shrink-0 md:w-auto'>
                            Publish Date
                        </Label>
                        <DatePicker
                            value={dateValue}
                            onChange={handleDateChange}
                            placeholder='Set date'
                            align='end'
                            className='flex-1 md:flex-none'
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
