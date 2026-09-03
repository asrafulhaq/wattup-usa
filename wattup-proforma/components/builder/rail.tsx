'use client';

/**
 * The left rail: the intro, then the eight sections as an accordion.
 *
 * Two rules carried over from the static tool because they are not cosmetic.
 * Consecutive half-width fields pair into one row, which is what keeps City and
 * County side by side rather than stacked down a column of ten. And sections 0, 1
 * and 2 stand open on first load, so the tool opens on something to fill in.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Field, Section } from '@/lib/proforma/sections';
import { DEFAULT_OPEN_SECTIONS, RAIL_INTRO_HTML, SECTIONS } from '@/lib/proforma/sections';
import { getPath, type EvpinState, type GalleryItem, type ImageSlot, type ImageSlots } from '@/lib/proforma/state';
import type { ProformaInputs } from '@/lib/proforma/model';
import {
    ColorField,
    EvpinField,
    GalleryField,
    ImageField,
    NumberField,
    PctListField,
    SelectField,
    TextField,
} from './fields';

export interface RailProps {
    inputs: ProformaInputs;
    images: ImageSlots;
    gallery: GalleryItem[];
    evpin: EvpinState;
    onFieldChange: (path: string, value: unknown) => void;
    onImagePick: (slot: ImageSlot, file: File) => void;
    onImageClear: (slot: ImageSlot) => void;
    onGalleryAdd: (files: FileList) => void;
    onGalleryCaption: (index: number, caption: string) => void;
    onGalleryMove: (index: number, direction: -1 | 1) => void;
    onGalleryRemove: (index: number) => void;
    onEvpinUrl: (url: string) => void;
    onEvpinText: (text: string) => void;
}

/** Group consecutive half-width fields into pairs, everything else alone. */
function packRows(fields: Field[]): Field[][] {
    const rows: Field[][] = [];
    let i = 0;
    while (i < fields.length) {
        const f = fields[i];
        const next = fields[i + 1];
        if (f.half && next?.half) {
            rows.push([f, next]);
            i += 2;
        } else {
            rows.push([f]);
            i += 1;
        }
    }
    return rows;
}

export function Rail(props: RailProps) {
    const { inputs, images, gallery, evpin } = props;

    const renderField = (field: Field) => {
        switch (field.type) {
            case 'evpin':
                return (
                    <EvpinField
                        key={field.k}
                        state={evpin}
                        onImportUrl={props.onEvpinUrl}
                        onImportText={props.onEvpinText}
                    />
                );
            case 'image':
                return (
                    <ImageField
                        key={field.k}
                        field={field}
                        src={images[field.slot as ImageSlot]}
                        onPick={props.onImagePick}
                        onClear={props.onImageClear}
                    />
                );
            case 'gallery':
                return (
                    <GalleryField
                        key={field.k}
                        field={field}
                        items={gallery}
                        onAdd={props.onGalleryAdd}
                        onCaption={props.onGalleryCaption}
                        onMove={props.onGalleryMove}
                        onRemove={props.onGalleryRemove}
                    />
                );
            default: {
                // `key` is passed explicitly rather than spread: React reads it off
                // the element, not the props object, and spreading it warns.
                const shared = {
                    field,
                    value: getPath(inputs, field.k),
                    onChange: (v: unknown) => props.onFieldChange(field.k, v),
                };
                if (field.type === 'number') return <NumberField key={field.k} {...shared} />;
                if (field.type === 'select') return <SelectField key={field.k} {...shared} />;
                if (field.type === 'color') return <ColorField key={field.k} {...shared} />;
                if (field.type === 'pctlist') return <PctListField key={field.k} {...shared} />;
                return <TextField key={field.k} {...shared} />;
            }
        }
    };

    const renderSection = (s: Section) => (
        <AccordionItem key={s.id} value={s.id} className='border-border/60 px-4'>
            <AccordionTrigger className='gap-3 py-3.5 hover:no-underline'>
                <span className='flex min-w-0 items-center gap-2.5'>
                    <span className='bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums'>
                        {s.n}
                    </span>
                    <span className='truncate text-[13px] font-semibold tracking-wide uppercase'>
                        {s.title}
                    </span>
                </span>
            </AccordionTrigger>
            <AccordionContent className='space-y-3.5 pb-5'>
                {s.note ? (
                    /*
                     * The section notes are the tool's documentation, authored in this
                     * repo and carried across verbatim from the static build. They are
                     * trusted markup, never user input: the only HTML in them is the
                     * <b> in sections 4 and 7.
                     */
                    <div
                        className='bg-muted/50 text-muted-foreground rounded-lg px-3 py-2.5 text-[11px] leading-relaxed [&_b]:text-foreground [&_b]:font-semibold'
                        dangerouslySetInnerHTML={{ __html: s.note }}
                    />
                ) : null}
                {packRows(s.fields).map((row, i) => (
                    <div key={i} className={row.length > 1 ? 'flex gap-3' : undefined}>
                        {row.map(renderField)}
                    </div>
                ))}
            </AccordionContent>
        </AccordionItem>
    );

    return (
        <ScrollArea className='h-full'>
            <div className='px-4 pt-4'>
                <div
                    className='text-muted-foreground border-border/60 border-b pb-4 text-[11px] leading-relaxed [&_b]:text-foreground [&_b]:font-semibold'
                    dangerouslySetInnerHTML={{ __html: RAIL_INTRO_HTML }}
                />
            </div>
            <Accordion
                type='multiple'
                defaultValue={SECTIONS.slice(0, DEFAULT_OPEN_SECTIONS).map((s) => s.id)}
                className='pb-16'
            >
                {SECTIONS.map(renderSection)}
            </Accordion>
        </ScrollArea>
    );
}
