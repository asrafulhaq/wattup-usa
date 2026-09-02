'use client';

import { deleteSingleImage, uploadSingleImage } from '@/app/_actions/image-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Upload an image, or paste a URL.
 *
 * The same Cloudinary action the article editor uses, so there is one upload path in the
 * dashboard rather than two that drift. The URL field stays because an image already
 * hosted elsewhere is a legitimate answer, and because it is the only way to see or
 * correct what is actually stored.
 *
 * The Cloudinary id travels with the URL: without it a replaced image is orphaned in the
 * account forever, since nothing else records where it came from.
 */
export function ImageUploadField({
    label,
    hint,
    value,
    publicId,
    folder,
    aspect = 'aspect-[1200/630]',
    onChange,
}: {
    label: string;
    hint?: string;
    value: string | null;
    publicId: string | null;
    /** Cloudinary folder, so uploads stay sorted by what they belong to. */
    folder: string;
    aspect?: string;
    onChange: (next: { url: string | null; publicId: string | null }) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setUploading] = useState(false);

    const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('That file is not an image.');
            return;
        }
        // Cloudinary's own limit is higher, but a 10MB social card is a slow page for
        // every visitor, so it is refused here with a reason rather than silently kept.
        if (file.size > 8 * 1024 * 1024) {
            toast.error('Images must be under 8MB.');
            return;
        }

        setUploading(true);
        const replacing = publicId;

        try {
            const result = await uploadSingleImage(file, { folder });
            if (result?.success && result.data) {
                onChange({ url: result.data.url, publicId: result.data.id });
                toast.success('Image uploaded');

                // Only after the replacement is safely stored. Deleting first would lose
                // the old image if the upload then failed.
                if (replacing && replacing !== result.data.id) {
                    deleteSingleImage(replacing).catch(() => {
                        // Not worth failing the save over: the new image is in place and
                        // the stale one is a tidiness problem, not a correctness one.
                    });
                }
            } else {
                toast.error('Upload failed.');
            }
        } catch {
            toast.error('Something went wrong during the upload.');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const onRemove = () => {
        if (publicId) deleteSingleImage(publicId).catch(() => {});
        onChange({ url: null, publicId: null });
    };

    return (
        <div className='flex flex-col gap-2'>
            <Label className='text-[13px] font-medium text-dash-body'>{label}</Label>

            <input
                type='file'
                ref={inputRef}
                onChange={onFile}
                accept='image/*'
                className='hidden'
            />

            <button
                type='button'
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className={`group relative flex w-full ${aspect} flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-dashed transition-colors ${
                    value
                        ? 'border-transparent'
                        : 'border-dash-border hover:border-primary/40 hover:bg-primary/[0.04]'
                }`}>
                {value ? (
                    <>
                        <Image
                            src={value}
                            alt=''
                            fill
                            className='object-cover'
                            unoptimized
                        />
                        <span className='absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-[13px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100'>
                            <Upload className='size-4' />
                            Replace image
                        </span>
                    </>
                ) : isUploading ? (
                    <span className='flex flex-col items-center gap-2 text-dash-muted'>
                        <Loader2 className='size-6 animate-spin text-primary' />
                        <span className='text-[12px]'>Uploading…</span>
                    </span>
                ) : (
                    <span className='flex flex-col items-center gap-1.5 text-dash-faint transition-colors group-hover:text-primary'>
                        <ImageIcon className='size-6' />
                        <span className='text-[13px] font-medium'>
                            Click to upload
                        </span>
                        <span className='text-[11px]'>PNG, JPG or WEBP, up to 8MB</span>
                    </span>
                )}
            </button>

            <Input
                value={value ?? ''}
                onChange={event =>
                    // Typed by hand, so there is no Cloudinary id to keep.
                    onChange({ url: event.target.value || null, publicId: null })
                }
                placeholder='…or paste an image URL'
            />

            {value && (
                <button
                    type='button'
                    onClick={onRemove}
                    className='flex items-center gap-1.5 self-start text-[12.5px] font-medium text-dash-muted transition-colors hover:text-destructive'>
                    <Trash2 className='size-3.5' />
                    Remove image
                </button>
            )}

            {hint && <p className='text-[12px] leading-relaxed text-dash-faint'>{hint}</p>}
        </div>
    );
}
