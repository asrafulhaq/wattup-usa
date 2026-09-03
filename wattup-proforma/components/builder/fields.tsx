'use client';

/**
 * The rail's field controls, one per type in lib/proforma/sections.ts.
 *
 * Each is a thin shell over the shared coercion helpers in lib/proforma/state.ts,
 * so the rules that decide what a keystroke stores live in one tested place rather
 * than in nine components. A number field that forgot its `scale` would turn 20%
 * utilization into 2000% and produce a confident, wrong pro-forma.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Field } from '@/lib/proforma/sections';
import {
    coerceFieldValue,
    displayNumber,
    displayPctList,
    type EvpinState,
    type GalleryItem,
    type ImageSlot,
} from '@/lib/proforma/state';

/* ---------------- shared shell ---------------- */

/** Label, control, and the field's hint. `half` is handled by the row packer above. */
function FieldShell({
    field,
    htmlFor,
    children,
}: {
    field: Field;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className='min-w-0 flex-1 space-y-1.5'>
            {field.label ? (
                <Label
                    htmlFor={htmlFor}
                    className='text-muted-foreground text-[11px] font-medium tracking-wide'
                >
                    {field.label}
                </Label>
            ) : null}
            {children}
            {field.hint ? (
                <p className='text-muted-foreground/80 text-[11px] leading-snug'>{field.hint}</p>
            ) : null}
        </div>
    );
}

export function fieldId(k: string) {
    return `f_${k.replace(/\./g, '_')}`;
}

/* ---------------- the value-carrying types ---------------- */

export interface ValueFieldProps {
    field: Field;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function TextField({ field, value, onChange }: ValueFieldProps) {
    const id = fieldId(field.k);
    return (
        <FieldShell field={field} htmlFor={id}>
            <Input
                id={id}
                value={value === undefined || value === null ? '' : String(value)}
                placeholder={field.ph}
                onChange={(e) => onChange(e.target.value)}
                className='h-9'
            />
        </FieldShell>
    );
}

/**
 * A number, with its unit printed inside the control's trailing edge.
 *
 * The displayed value and the stored value are not the same number when the field
 * carries a `scale`: the model holds utilization as 0.2 and this shows 20.
 */
export function NumberField({ field, value, onChange }: ValueFieldProps) {
    const id = fieldId(field.k);
    return (
        <FieldShell field={field} htmlFor={id}>
            <div className='relative'>
                <Input
                    id={id}
                    type='number'
                    inputMode='decimal'
                    step={field.step}
                    min={field.min}
                    value={displayNumber(value, field.scale)}
                    onChange={(e) => onChange(coerceFieldValue('number', e.target.value, field.scale))}
                    className={cn('h-9 tabular-nums', field.unit && 'pr-14')}
                />
                {field.unit ? (
                    <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-medium'>
                        {field.unit}
                    </span>
                ) : null}
            </div>
        </FieldShell>
    );
}

export function SelectField({ field, value, onChange }: ValueFieldProps) {
    const id = fieldId(field.k);
    return (
        <FieldShell field={field} htmlFor={id}>
            <Select
                value={String(value)}
                onValueChange={(v) => onChange(coerceFieldValue('select', v))}
            >
                <SelectTrigger id={id} className='h-9 w-full'>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(field.options ?? []).map((o) => (
                        <SelectItem key={o.v} value={o.v}>
                            {o.l}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FieldShell>
    );
}

export function ColorField({ field, value, onChange }: ValueFieldProps) {
    const id = fieldId(field.k);
    const current = (value as string) || '#3B7DFF';
    return (
        <FieldShell field={field} htmlFor={id}>
            <div className='flex items-center gap-2'>
                <input
                    id={id}
                    type='color'
                    value={current}
                    onChange={(e) => onChange(e.target.value)}
                    className='border-input h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1'
                />
                <Input
                    value={current}
                    onChange={(e) => onChange(e.target.value)}
                    className='h-9 font-mono text-xs uppercase'
                    aria-label={`${field.label} hex value`}
                />
            </div>
        </FieldShell>
    );
}

/** Comma-separated utilization percentages for the sensitivity table. */
export function PctListField({ field, value, onChange }: ValueFieldProps) {
    const id = fieldId(field.k);
    // Held locally while typing: coercing on every keystroke would rewrite "25, "
    // to "25" mid-entry and make the comma impossible to type.
    const [draft, setDraft] = useState<string | null>(null);
    const shown = draft ?? displayPctList(value);

    return (
        <FieldShell field={field} htmlFor={id}>
            <Input
                id={id}
                value={shown}
                placeholder='25, 20, 15, 10'
                onChange={(e) => {
                    setDraft(e.target.value);
                    onChange(coerceFieldValue('pctlist', e.target.value));
                }}
                onBlur={() => setDraft(null)}
                className='h-9 tabular-nums'
            />
        </FieldShell>
    );
}

/* ---------------- images ---------------- */

export interface ImageFieldProps {
    field: Field;
    src: string | null;
    onPick: (slot: ImageSlot, file: File) => void;
    onClear: (slot: ImageSlot) => void;
}

export function ImageField({ field, src, onPick, onClear }: ImageFieldProps) {
    const slot = field.slot as ImageSlot;
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    const take = (files: FileList | null) => {
        const f = files?.[0];
        if (f && f.type.startsWith('image/')) onPick(slot, f);
    };

    return (
        <FieldShell field={field}>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e: DragEvent) => {
                    e.preventDefault();
                    setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e: DragEvent) => {
                    e.preventDefault();
                    setOver(false);
                    take(e.dataTransfer.files);
                }}
                className={cn(
                    'group border-input relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors',
                    src ? 'h-28 p-0' : 'text-muted-foreground h-20 text-xs',
                    over && 'border-primary bg-primary/5'
                )}
            >
                {src ? (
                    <>
                        {/* The document's own images, so next/image would only add a proxy. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt='' className='h-full w-full object-cover' />
                        <button
                            type='button'
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear(slot);
                            }}
                            className='bg-background/90 text-foreground absolute top-2 right-2 rounded-md px-2 py-1 text-[11px] font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100'
                        >
                            remove
                        </button>
                    </>
                ) : (
                    <span className='flex items-center gap-2'>
                        <ImagePlus className='size-4' />
                        Click or drop an image
                    </span>
                )}
            </div>
            <input
                ref={inputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    take(e.target.files);
                    e.target.value = '';
                }}
            />
        </FieldShell>
    );
}

/* ---------------- the placement gallery ---------------- */

export interface GalleryFieldProps {
    field: Field;
    items: GalleryItem[];
    onAdd: (files: FileList) => void;
    onCaption: (index: number, caption: string) => void;
    onMove: (index: number, direction: -1 | 1) => void;
    onRemove: (index: number) => void;
}

export function GalleryField({
    field,
    items,
    onAdd,
    onCaption,
    onMove,
    onRemove,
}: GalleryFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);
    const pages = Math.ceil(items.length / 6);

    return (
        <FieldShell field={field}>
            <div className='space-y-2'>
                <AnimatePresence initial={false}>
                    {items.map((g, i) => (
                        <motion.div
                            key={`${i}-${g.src.slice(-24)}`}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                            className='bg-muted/40 flex items-center gap-2 overflow-hidden rounded-lg p-2'
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={g.src}
                                alt=''
                                className='size-12 shrink-0 rounded object-cover'
                            />
                            <div className='min-w-0 flex-1 space-y-1'>
                                <Input
                                    value={g.caption ?? ''}
                                    placeholder='Caption (optional)'
                                    onChange={(e) => onCaption(i, e.target.value)}
                                    className='h-7 text-xs'
                                />
                                <div className='flex gap-1'>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='size-6'
                                        title='Move up'
                                        disabled={i === 0}
                                        onClick={() => onMove(i, -1)}
                                    >
                                        <ArrowUp className='size-3' />
                                    </Button>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='size-6'
                                        title='Move down'
                                        disabled={i === items.length - 1}
                                        onClick={() => onMove(i, 1)}
                                    >
                                        <ArrowDown className='size-3' />
                                    </Button>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='text-destructive size-6'
                                        title='Remove'
                                        onClick={() => onRemove(i)}
                                    >
                                        <X className='size-3' />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e: DragEvent) => {
                        e.preventDefault();
                        setOver(true);
                    }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e: DragEvent) => {
                        e.preventDefault();
                        setOver(false);
                        if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
                    }}
                    className={cn(
                        'text-muted-foreground border-input flex h-16 cursor-pointer items-center justify-center rounded-lg border border-dashed px-3 text-center text-[11px] transition-colors',
                        over && 'border-primary bg-primary/5'
                    )}
                >
                    Click or drop images · placement plans, renderings, elevations
                </div>

                {items.length ? (
                    <p className='text-muted-foreground text-[11px] tabular-nums'>
                        {items.length} image{items.length > 1 ? 's' : ''} · {pages} added page
                        {items.length > 6 ? 's' : ''}
                    </p>
                ) : null}
            </div>
            <input
                ref={inputRef}
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files?.length) onAdd(e.target.files);
                    e.target.value = '';
                }}
            />
        </FieldShell>
    );
}

/* ---------------- EVpin ---------------- */

export interface EvpinFieldProps {
    state: EvpinState;
    onImportUrl: (url: string) => void;
    onImportText: (text: string) => void;
}

export function EvpinField({ state, onImportUrl, onImportText }: EvpinFieldProps) {
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const busy = state.status === 'busy';

    return (
        <div className='space-y-3'>
            <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        onImportUrl(url);
                    }
                }}
                placeholder='https://evpin.com/report/…'
                className='h-9'
            />
            <Button
                type='button'
                size='sm'
                className='w-full'
                disabled={busy}
                onClick={() => onImportUrl(url)}
            >
                {busy ? <Loader2 className='size-3.5 animate-spin' /> : null}
                Import from link
            </Button>

            <div className='flex items-center gap-3'>
                <span className='bg-border h-px flex-1' />
                <span className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                    or paste the report text
                </span>
                <span className='bg-border h-px flex-1' />
            </div>

            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder='Select all on the EVpin report page and paste here'
                className='resize-y text-xs'
            />
            <Button
                type='button'
                size='sm'
                variant='secondary'
                className='w-full'
                disabled={busy}
                onClick={() => onImportText(text)}
            >
                Read pasted text
            </Button>

            <AnimatePresence>
                {state.detail ? (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            'rounded-md px-2.5 py-2 text-[11px] leading-snug',
                            state.status === 'ok' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            state.status === 'warn' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            state.status === 'busy' && 'bg-muted text-muted-foreground'
                        )}
                    >
                        {state.detail}
                    </motion.p>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
