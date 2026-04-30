'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { RefObject } from 'react';

interface FormImageProps {
    imageUrl: string;
    imageAlt: string;
    isUploading: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onUploadClick: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlChange: (value: string) => void;
    onAltChange: (value: string) => void;
    onRemove: () => void;
}

export default function FormImage({
    imageUrl,
    imageAlt,
    isUploading,
    fileInputRef,
    onUploadClick,
    onFileChange,
    onUrlChange,
    onAltChange,
    onRemove,
}: FormImageProps) {
    return (
        <Card className='shadow-none border-border rounded-md'>
            <CardHeader className='px-4 pt-4 pb-2'>
                <CardTitle className='text-sm font-medium text-foreground uppercase tracking-wider'>
                    Featured Image
                </CardTitle>
            </CardHeader>
            <CardContent className='p-4 space-y-4'>
                <input
                    type='file'
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept='image/*'
                    className='hidden'
                />

                <div className='grid gap-6 md:grid-cols-[1fr_2fr]'>
                    {/* Upload/Preview Zone */}
                    <button
                        type='button'
                        onClick={onUploadClick}
                        disabled={isUploading}
                        className={`relative w-full aspect-video rounded-md border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center group ${
                            imageUrl
                                ? 'border-transparent'
                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        }`}>
                        {imageUrl ? (
                            <>
                                <Image
                                    src={imageUrl}
                                    alt={imageAlt || 'Featured'}
                                    fill
                                    className='object-cover'
                                    unoptimized
                                />
                                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-normal'>
                                    <Upload className='h-4 w-4' /> Change Image
                                </div>
                            </>
                        ) : isUploading ? (
                            <div className='flex flex-col items-center gap-2'>
                                <Loader2 className='h-8 w-8 animate-spin text-primary' />
                                <span className='text-xs font-normal text-muted-foreground'>
                                    Uploading…
                                </span>
                            </div>
                        ) : (
                            <div className='flex flex-col items-center gap-2 text-muted-foreground/60 group-hover:text-primary/70 transition-colors'>
                                <ImageIcon className='h-8 w-8' />
                                <span className='text-sm font-normal'>
                                    Click to upload cover image
                                </span>
                                <span className='text-[10px] uppercase tracking-tighter'>
                                    PNG, JPG, WEBP
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Image Metadata */}
                    <div className='space-y-4'>
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='image-url'
                                className='text-xs font-normal text-muted-foreground uppercase tracking-wide'>
                                Image URL
                            </Label>
                            <Input
                                id='image-url'
                                placeholder='https://...'
                                value={imageUrl}
                                onChange={e => onUrlChange(e.target.value)}
                                className='h-9 text-sm font-mono'
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <Label
                                htmlFor='image-alt'
                                className='text-xs font-normal text-muted-foreground uppercase tracking-wide'>
                                Alt Text (SEO)
                            </Label>
                            <Input
                                id='image-alt'
                                placeholder='Describe this image for search engines...'
                                value={imageAlt}
                                onChange={e => onAltChange(e.target.value)}
                                className='h-9 text-sm'
                            />
                        </div>

                        {imageUrl && (
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs w-full justify-center'
                                onClick={onRemove}>
                                Remove Featured Image
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

