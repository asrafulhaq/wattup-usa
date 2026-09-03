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

    const runFit = useCallback(() => fitPages(frameRef.current), []);

    /*
     * Update the document IN PLACE. Never through the srcdoc attribute.
     *
     * Handing React a new `srcDoc` makes the iframe navigate: it blanks, parses
     * half a megabyte, and repaints. Measured before this change, typing eleven
     * characters fired eleven load events, and that white flash per character was
     * the blink.
     *
     * Writing into the live document has no navigation and therefore no blank
     * frame. The head is only touched when it actually differs, because it holds
     * the whole stylesheet and replacing it forces a full restyle of six to nine
     * pages for nothing; on a keystroke only the body has changed.
     */
    useEffect(() => {
        const frame = frameRef.current;
        if (!frame || !html) return;

        let doc: Document | null | undefined;
        try {
            doc = frame.contentDocument;
        } catch {
            return;
        }
        if (!doc) return;

        if (!doc.body || !doc.body.firstChild) {
            // First paint. open/write/close is synchronous, so there is no window
            // in which the frame is empty and no load event to wait for.
            doc.open();
            doc.write(html);
            doc.close();
        } else {
            const next = new DOMParser().parseFromString(html, 'text/html');
            if (doc.head.innerHTML !== next.head.innerHTML) {
                doc.head.innerHTML = next.head.innerHTML;
            }
            if (doc.body.className !== next.body.className) {
                doc.body.className = next.body.className;
            }
            doc.body.innerHTML = next.body.innerHTML;
        }

        // Layout is only measurable once the new content is in the tree.
        const t = setTimeout(runFit, 0);
        return () => clearTimeout(t);
    }, [html, runFit]);

    const docHeight = PAGE_H_IN * pageCount * DPI;

    return (
        <>
            <div ref={viewerRef} className='bg-muted/40 min-h-0 flex-1 overflow-auto p-3 sm:p-6'>
                {/*
                  * Two elements, and the outer one is not decoration.
                  *
                  * `transform: scale()` paints smaller but does NOT shrink the layout
                  * box: the page stayed 816px wide whatever the zoom, so on a phone at
                  * 45% the viewer reserved 816px, scrolled sideways, and left a wide
                  * dead margin beside a document that was visibly only ~370px across.
                  * The outer element carries the SCALED size so layout agrees with what
                  * is on screen; the inner one keeps the true page size and scales from
                  * its top left corner into it.
                  */}
                <div
                    className='mx-auto'
                    style={{ width: PAGE_W_IN * DPI * zoom, height: docHeight * zoom }}
                >
                    <div
                        className='origin-top-left shadow-2xl'
                        style={{
                            width: PAGE_W_IN * DPI,
                            height: docHeight,
                            transform: `scale(${zoom})`,
                        }}
                    >
                        {/*
                          * No srcDoc prop: the effect above owns this document's
                          * content. Letting React set srcdoc would re-navigate the
                          * frame on every change, which is the flicker this avoids.
                          */}
                        <iframe
                            ref={frameRef}
                            title='Pro-forma preview'
                            // allow-modals is what lets print() run inside the frame.
                            sandbox='allow-same-origin allow-modals'
                            className='w-full border-0 bg-white'
                            style={{ height: docHeight }}
                        />
                    </div>
                </div>
            </div>

            {/* Wraps to a second row rather than overflowing: responsive first. */}
            <div className='border-border/60 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-t px-3 py-2 sm:px-5 sm:py-2.5'>
                <span className='text-muted-foreground hidden text-[11px] font-medium sm:inline'>
                    Zoom
                </span>
                <Slider
                    value={[zoom]}
                    min={0.25}
                    max={1.4}
                    step={0.01}
                    onValueChange={([v]) => onZoomChange(v)}
                    className='w-24 sm:w-40'
                    aria-label='Preview zoom'
                />
                <span className='text-muted-foreground w-9 text-[11px] tabular-nums'>
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={onFitWidth}
                    className='h-7 gap-1.5 px-2'
                >
                    <Maximize2 className='size-3' />
                    <span className='hidden sm:inline'>Fit width</span>
                </Button>
                <span className='hidden flex-1 sm:block' />
                {/* The long form only when there is room for it on one line. */}
                <span className='text-muted-foreground ml-auto text-[11px] whitespace-nowrap tabular-nums'>
                    <span className='hidden sm:inline'>{pageCountLabel(pageCount)}</span>
                    <span className='sm:hidden'>{pageCount} pages</span>
                </span>
            </div>
        </>
    );
});
