/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { uploadSingleImage } from '@/app/_actions/image-actions';
import { createArticle, updateArticle } from '@/app/_actions/postActions';
import { Posts } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner';

// ── Sub-components ───────────────────────────────────────────
import FormEditor from './article-form/editor';
import FormImage from './article-form/featured-image';
import FormHeader from './article-form/header-actions';
import FormMetadata from './article-form/metadata';

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
    error: string;
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
        error: '',
    };
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
        // Clear any previous errors
        dispatch({ type: 'SET_FIELD', field: 'error', value: '' });

        try {
            const formData = {
                title,
                slug,
                content,
                status: publish ? 'Published' : status,
                pinned,
                image: imageUrl,
                imageAlt,
            };

            const res = initialData?.id
                ? await updateArticle(initialData.id, formData)
                : await createArticle(formData);

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
            } else {
                const errMsg = res.error || 'Failed to save article';
                toast.error(errMsg);
                dispatch({
                    type: 'SET_FIELD',
                    field: 'error',
                    value: errMsg,
                });
            }
        } catch (error: any) {
            const errMsg = error.message || 'Something went wrong';
            toast.error(errMsg);
            dispatch({
                type: 'SET_FIELD',
                field: 'error',
                value: errMsg,
            });
        } finally {
            dispatch({ type: 'SET_SAVING', value: false });
        }
    };

    return (
        <div className='flex flex-1 flex-col gap-6 p-2 sm:p-4 pt-0'>
            <FormHeader
                initialData={initialData}
                status={status}
                isSaving={isSaving}
                onSave={handleSave}
            />

            {state.error && (
                <div className='bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1'>
                    <span className='font-medium'>Error:</span>
                    {state.error}
                </div>
            )}

            <div className='flex flex-col gap-4'>
                <FormMetadata
                    slug={slug}
                    status={status}
                    pinned={pinned}
                    onSlugChange={set('slug')}
                    onStatusChange={set('status')}
                    onPinnedChange={set('pinned')}
                />

                <FormEditor
                    title={title}
                    content={content}
                    onTitleChange={set('title')}
                    onContentChange={set('content')}
                />

                <FormImage
                    imageUrl={imageUrl}
                    imageAlt={imageAlt}
                    isUploading={isUploading}
                    fileInputRef={fileInputRef}
                    onUploadClick={handleUploadClick}
                    onFileChange={handleFileChange}
                    onUrlChange={set('imageUrl')}
                    onAltChange={set('imageAlt')}
                    onRemove={() => {
                        set('imageUrl')('');
                        set('imageAlt')('');
                    }}
                />
            </div>
        </div>
    );
}

