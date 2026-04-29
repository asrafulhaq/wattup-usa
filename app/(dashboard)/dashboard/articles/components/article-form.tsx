'use client';

import { uploadSingleImage } from '@/app/_actions/image-actions';
import { upsertArticle } from '@/app/_actions/postActions';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Posts } from '@prisma/client';
import { IconDeviceFloppy, IconSend } from '@tabler/icons-react';
import {
    ChevronLeft,
    Image as ImageIcon,
    Loader2,
    Pin,
    Upload,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner';
import PageTitle from '../../components/page-title';

// ── Types ──────────────────────────────────────────────────────
interface ArticleFormProps {
    initialData?: Posts | null;
}
interface FormState {
    title: string;
    slug: string;
    content: string;
    status: string;
    pinned: boolean;
    imageUrl: string;
    imageAlt: string;
    isSaving: boolean;
    isUploading: boolean;
}
type FormAction =
    | {
          type: 'SET_FIELD';
          field: keyof Omit<FormState, 'isSaving' | 'isUploading'>;
          value: string | boolean;
      }
    | { type: 'SET_SAVING'; value: boolean }
    | { type: 'SET_UPLOADING'; value: boolean }
    | { type: 'RESET'; payload: Omit<FormState, 'isSaving' | 'isUploading'> };

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'SET_SAVING':
            return { ...state, isSaving: action.value };
        case 'SET_UPLOADING':
            return { ...state, isUploading: action.value };
        case 'RESET':
            return {
                ...state,
                ...action.payload,
                isSaving: false,
                isUploading: false,
            };
        default:
            return state;
    }
}
function makeInitialState(d?: Posts | null): FormState {
    return {
        title: d?.title || '',
        slug: d?.slug || '',
        content: d?.content || '',
        status: d?.status || 'Draft',
        pinned: d?.pinned || false,
        imageUrl: d?.image || '',
        imageAlt: d?.imageAlt || '',
        isSaving: false,
        isUploading: false,
    };
}

function StatusBadge({ status }: { status: string }) {
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

// ── Component ──────────────────────────────────────────────────
export default function ArticleForm({ initialData }: ArticleFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [state, dispatch] = useReducer(formReducer, undefined, () =>
        makeInitialState(initialData)
    );
    const {
        title,
        slug,
        content,
        status,
        pinned,
        imageUrl,
        imageAlt,
        isSaving,
        isUploading,
    } = state;

    const set =
        (field: keyof Omit<FormState, 'isSaving' | 'isUploading'>) =>
        (value: string | boolean) =>
            dispatch({ type: 'SET_FIELD', field, value });

    useEffect(() => {
        if (!initialData) {
            const s = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            dispatch({ type: 'SET_FIELD', field: 'slug', value: s });
        }
    }, [title, initialData]);

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        dispatch({ type: 'SET_UPLOADING', value: true });
        try {
            const res = await uploadSingleImage(file, { folder: 'articles' });
            if (res.success && res.data) {
                dispatch({
                    type: 'SET_FIELD',
                    field: 'imageUrl',
                    value: res.data.url,
                });
                toast.success('Image uploaded successfully');
            } else toast.error('Upload failed');
        } catch {
            toast.error('Something went wrong during upload');
        } finally {
            dispatch({ type: 'SET_UPLOADING', value: false });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (publish = false) => {
        if (!title || !content) {
            toast.error('Title and content are required');
            return;
        }
        dispatch({ type: 'SET_SAVING', value: true });
        try {
            const res = await upsertArticle(initialData?.id, {
                title,
                slug,
                content,
                status: publish ? 'Published' : status,
                pinned,
                image: imageUrl,
                imageAlt,
            });
            if (res.success) {
                toast.success(
                    initialData ? 'Article updated' : 'Article created'
                );
                if (initialData) {
                    if (publish)
                        dispatch({
                            type: 'SET_FIELD',
                            field: 'status',
                            value: 'Published',
                        });
                } else {
                    dispatch({
                        type: 'RESET',
                        payload: makeInitialState(null),
                    });
                    router.push('/dashboard/articles');
                }
            } else toast.error(res.error || 'Failed to save article');
        } catch {
            toast.error('Something went wrong');
        } finally {
            dispatch({ type: 'SET_SAVING', value: false });
        }
    };

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className='flex flex-1 flex-col gap-6 p-2 sm:p-4 pt-0'>
            {/* ── Sticky Header ── */}
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
                                    initialData
                                        ? 'Edit Article'
                                        : 'Write Article'
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
                        onClick={() => handleSave(false)}
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
                        onClick={() => handleSave(true)}
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

            {/* ── Single-column body ── */}
            <div className='flex flex-col gap-4'>
                {/* ── Metadata bar (above editor) ── */}
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
                                    onChange={e => set('slug')(e.target.value)}
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
                                    onValueChange={set('status')}>
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
                                <Switch
                                    checked={pinned}
                                    onCheckedChange={set('pinned')}
                                    className='scale-75'
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Editor Card ── */}
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
                                onChange={e => set('title')(e.target.value)}
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
                                onChange={set('content')}
                                placeholder='Start writing your story…'
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Featured Image Card (Bottom) ── */}
                <Card className='shadow-none border-border rounded-md'>
                    <CardHeader className='px-4 pt-4 pb-2'>
                        <CardTitle className='text-sm font-semibold text-foreground uppercase tracking-wider'>
                            Featured Image
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='p-4 space-y-4'>
                        <input
                            type='file'
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept='image/*'
                            className='hidden'
                        />

                        <div className='grid gap-6 md:grid-cols-[1fr_2fr]'>
                            {/* Upload/Preview Zone */}
                            <button
                                type='button'
                                onClick={handleUploadClick}
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
                                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium'>
                                            <Upload className='h-4 w-4' />{' '}
                                            Change Image
                                        </div>
                                    </>
                                ) : isUploading ? (
                                    <div className='flex flex-col items-center gap-2'>
                                        <Loader2 className='h-8 w-8 animate-spin text-primary' />
                                        <span className='text-xs font-medium text-muted-foreground'>
                                            Uploading…
                                        </span>
                                    </div>
                                ) : (
                                    <div className='flex flex-col items-center gap-2 text-muted-foreground/60 group-hover:text-primary/70 transition-colors'>
                                        <ImageIcon className='h-8 w-8' />
                                        <span className='text-sm font-medium'>
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
                                        className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                                        Image URL
                                    </Label>
                                    <Input
                                        id='image-url'
                                        placeholder='https://...'
                                        value={imageUrl}
                                        onChange={e =>
                                            set('imageUrl')(e.target.value)
                                        }
                                        className='h-9 text-sm font-mono'
                                    />
                                </div>
                                <div className='space-y-1.5'>
                                    <Label
                                        htmlFor='image-alt'
                                        className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                                        Alt Text (SEO)
                                    </Label>
                                    <Input
                                        id='image-alt'
                                        placeholder='Describe this image for search engines...'
                                        value={imageAlt}
                                        onChange={e =>
                                            set('imageAlt')(e.target.value)
                                        }
                                        className='h-9 text-sm'
                                    />
                                </div>

                                {imageUrl && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs w-full justify-center'
                                        onClick={() => {
                                            set('imageUrl')('');
                                            set('imageAlt')('');
                                        }}>
                                        Remove Featured Image
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

