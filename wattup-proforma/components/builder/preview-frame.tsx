'use client';

/**
 * The document, in a srcdoc iframe, plus the zoom bar under it.
 *
 * The iframe is not a detail to be modernised away. It is what isolates the
 * document's stylesheet from the app's, so a Tailwind reset can never reach a page
 * that goes to a landlord; it is what `print()` targets; and its live DOM is what
 * the export reads back, so the footer guard's scaling is carried into the PDF.
 *
 * Nothing in here reads the theme. The document is a printed sales document and
 * looks the same whichever theme the panel is in.
 */
import { Maximize2 } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { pageCountLabel } from '@/lib/proforma/state';

const DPI = 96;
const PAGE_H_IN = 11;
const PAGE_W_IN = 8.5;

/** Clearance we insist on between a page's content and its footer, in px. */
const FIT_MIN_GAP = 8;
/** Never shrink a page more than this: it degrades gently rather than collapsing. */
const FIT_MIN_SCALE = 0.88;

export interface PreviewHandle {
    /** The live document, so exports carry the footer guard's scaling. */
    currentHtml: () => string;
    print: () => boolean;
}

export interface PreviewFrameProps {
    html: string;
    pageCount: number;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onFitWidth: () => void;
    viewerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * The footer-collision guard, carried over unchanged in intent.
 *
 * Pages are a fixed 11in and the footer is absolutely positioned, so content that
 * grows past the safe area slides underneath it rather than reflowing. Font metrics
 * differ per machine (the document asks for Helvetica Neue, which not every OS
 * has), so a layout that clears the footer on one machine can collide on another.
 * After each render we measure real clearance and scale a short page's content just
 * enough to clear, capped.
 */
function fitPages(frame: HTMLIFrameElement | null) {
    let doc: Document | null | undefined;
    try {
        doc = frame?.contentDocument;
    } catch {
        return;
    }
    if (!doc?.body) return;

    const adjusted: { page: number; gap: number; scale: number }[] = [];
    doc.querySelectorAll('.page').forEach((page, i) => {
        const pad = page.querySelector<HTMLElement>('.pad');
        const foot = page.querySelector<HTMLElement>('.footline');
        if (!pad || !foot) return;

        pad.style.transform = '';
        pad.style.transformOrigin = 'top center';

        const kids = Array.from(pad.children).filter(
            (c) => !c.classList.contains('footline') && !c.classList.contains('pgnum')
        );
        const last = kids[kids.length - 1];
        if (!last) return;

        const footTop = foot.getBoundingClientRect().top;
        const padTop = pad.getBoundingClientRect().top;
        const contentBottom = last.getBoundingClientRect().bottom;
        const gap = footTop - contentBottom;
        if (gap >= FIT_MIN_GAP) return;

        const usable = footTop - padTop - FIT_MIN_GAP;
        const needed = contentBottom - padTop;
        const scale = Math.max(FIT_MIN_SCALE, usable / needed);
        pad.style.transform = `scale(${scale.toFixed(4)})`;
        adjusted.push({ page: i + 1, gap: Math.round(gap), scale: +scale.toFixed(3) });
    });

    if (adjusted.length) {
        console.warn('[proforma] pages scaled to clear the footer:', adjusted);
    }
}

export const PreviewFrame = forwardRef<PreviewHandle, PreviewFrameProps>(function PreviewFrame(
    { html, pageCount, zoom, onZoomChange, onFitWidth, viewerRef },
    ref
) {
    const frameRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
        currentHtml: () => {
            try {
                const d = frameRef.current?.contentDocument;
                if (d?.documentElement) return `<!doctype html>${d.documentElement.outerHTML}`;
            } catch {
                /* cross-document access refused; the raw markup is still correct */
            }
            return html;
        },
        print: () => {
            try {
                frameRef.current?.contentWindow?.focus();
                frameRef.current?.contentWindow?.print();
                return true;
            } catch {
                return false;
            }
        },
    }));

    // Measure only once the new srcdoc has parsed. The load event is the reliable
    // signal; the timeout covers browsers that reuse a document without firing it.
    const runFit = useCallback(() => fitPages(frameRef.current), []);
    useEffect(() => {
        const f = frameRef.current;
        if (!f) return;
        f.addEventListener('load', runFit, { once: true });
        const t = setTimeout(runFit, 60);
        return () => {
            f.removeEventListener('load', runFit);
            clearTimeout(t);
        };
    }, [html, runFit]);

    const docHeight = PAGE_H_IN * pageCount * DPI;

    return (
        <>
            <div ref={viewerRef} className='bg-muted/40 min-h-0 flex-1 overflow-auto p-6'>
                <div
                    className='mx-auto origin-top shadow-2xl'
                    style={{
                        width: PAGE_W_IN * DPI,
                        height: docHeight * zoom,
                        transform: `scale(${zoom})`,
                    }}
                >
                    <iframe
                        ref={frameRef}
                        title='Pro-forma preview'
                        // allow-modals is what lets print() run inside the frame.
                        sandbox='allow-same-origin allow-modals'
                        srcDoc={html}
                        className='w-full border-0 bg-white'
                        style={{ height: docHeight }}
                    />
                </div>
            </div>

            <div className='border-border/60 flex shrink-0 items-center gap-3 border-t px-5 py-2.5'>
                <span className='text-muted-foreground text-[11px] font-medium'>Zoom</span>
                <Slider
                    value={[zoom]}
                    min={0.25}
                    max={1.4}
                    step={0.01}
                    onValueChange={([v]) => onZoomChange(v)}
                    className='w-40'
                    aria-label='Preview zoom'
                />
                <span className='text-muted-foreground w-10 text-[11px] tabular-nums'>
                    {Math.round(zoom * 100)}%
                </span>
                <Button type='button' variant='ghost' size='sm' onClick={onFitWidth} className='h-7 gap-1.5'>
                    <Maximize2 className='size-3' />
                    Fit width
                </Button>
                <span className='flex-1' />
                <span className='text-muted-foreground text-[11px] tabular-nums'>
                    {pageCountLabel(pageCount)}
                </span>
            </div>
        </>
    );
});
