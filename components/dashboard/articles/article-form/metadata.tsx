'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pin } from 'lucide-react';

interface FormMetadataProps {
    slug: string;
    status: string;
    pinned: boolean;
    onSlugChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onPinnedChange: (value: boolean) => void;
}

export default function FormMetadata({
    slug,
    status,
    pinned,
    onSlugChange,
    onStatusChange,
    onPinnedChange,
}: FormMetadataProps) {
    return (
        <Card className='shadow-none border-border rounded-md'>
            <CardContent className='p-3'>
                <div className='flex flex-wrap items-center gap-3'>
                    {/* Slug */}
                    <div className='flex items-center gap-2 flex-1 min-w-[200px]'>
                        <Label
                            htmlFor='slug'
                            className='text-xs text-muted-foreground whitespace-nowrap'>
                            Slug
                        </Label>
                        <Input
                            id='slug'
                            value={slug}
                            onChange={e => onSlugChange(e.target.value)}
                            placeholder='article-url-slug'
                            className='h-8 text-xs font-mono bg-muted/30 min-w-0'
                        />
                    </div>

                    {/* Status */}
                    <div className='flex items-center gap-2'>
                        <Label
                            htmlFor='status'
                            className='text-xs text-muted-foreground whitespace-nowrap'>
                            Status
                        </Label>
                        <Select
                            value={status}
                            onValueChange={onStatusChange}>
                            <SelectTrigger
                                id='status'
                                className='h-8 w-32 text-xs'>
                                <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    {
                                        value: 'Draft',
                                        color: 'bg-amber-500',
                                    },
                                    {
                                        value: 'Published',
                                        color: 'bg-emerald-500',
                                    },
                                    {
                                        value: 'Archived',
                                        color: 'bg-zinc-400',
                                    },
                                ].map(({ value, color }) => (
                                    <SelectItem
                                        key={value}
                                        value={value}
                                        className='text-xs'>
                                        <span className='flex items-center gap-2'>
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${color}`}
                                            />
                                            {value}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pin */}
                    <div className='flex items-center gap-2 border border-border/60 rounded-md px-2.5 py-1.5 bg-muted/20'>
                        <Pin
                            className={`h-3.5 w-3.5 ${pinned ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span className='text-xs font-medium text-muted-foreground'>
                            Pin to Home
                        </span>
                        <span className="sr-only">Pin to Home</span>
                        <Switch
                            checked={pinned}
                            onCheckedChange={onPinnedChange}
                            className='scale-75'
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
