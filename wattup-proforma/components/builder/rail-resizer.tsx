'use client';

/**
 * The drag handle between the control rail and the document.
 *
 * Pointer events with capture, not mousemove on the window: capture keeps the
 * drag alive when the pointer crosses the iframe, which a plain mousemove
 * listener loses the moment it enters another document. Width is committed
 * through a ref and an animation frame so a fast drag costs one layout per frame
 * rather than one per pointer event.
 *
 * It is a real separator: focusable, arrow keys move it, Home and End jump to the
 * limits, and a double click restores the default.
 */
import { useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { clampRailWidth, RAIL_DEFAULT, RAIL_MAX, RAIL_MIN } from '@/lib/proforma/rail-width';

export interface RailResizerProps {
    width: number;
    onWidth: (px: number) => void;
    /** Called once when the drag ends, so the preference is written once, not per frame. */
    onCommit: (px: number) => void;
}

export function RailResizer({ width, onWidth, onCommit }: RailResizerProps) {
    const dragging = useRef(false);
    const frame = useRef<number | null>(null);
    const latest = useRef(width);

    useEffect(() => {
        latest.current = width;
    }, [width]);

    useEffect(
        () => () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
        },
        []
    );

    const schedule = useCallback(
        (px: number) => {
            latest.current = clampRailWidth(px);
            if (frame.current !== null) return;
            frame.current = requestAnimationFrame(() => {
                frame.current = null;
                onWidth(latest.current);
            });
        },
        [onWidth]
    );

    const step = (delta: number) => {
        const next = clampRailWidth(latest.current + delta);
        onWidth(next);
        onCommit(next);
    };

    return (
        <div
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize the control panel'
            aria-valuenow={width}
            aria-valuemin={RAIL_MIN}
            aria-valuemax={RAIL_MAX}
            tabIndex={0}
            onPointerDown={(e) => {
                e.preventDefault();
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                // The document is in an iframe that would otherwise swallow the
                // pointer and select text under it while the drag is in flight.
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'col-resize';
            }}
            onPointerMove={(e) => {
                if (!dragging.current) return;
                schedule(e.clientX);
            }}
            onPointerUp={(e) => {
                if (!dragging.current) return;
                dragging.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                onCommit(latest.current);
            }}
            onDoubleClick={() => {
                onWidth(RAIL_DEFAULT);
                onCommit(RAIL_DEFAULT);
            }}
            onKeyDown={(e) => {
                const big = e.shiftKey ? 48 : 16;
                if (e.key === 'ArrowLeft') { e.preventDefault(); step(-big); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); step(big); }
                else if (e.key === 'Home') { e.preventDefault(); onWidth(RAIL_MIN); onCommit(RAIL_MIN); }
                else if (e.key === 'End') { e.preventDefault(); onWidth(RAIL_MAX); onCommit(RAIL_MAX); }
            }}
            title='Drag to resize · double click to reset'
            className={cn(
                'group relative z-10 w-1.5 shrink-0 cursor-col-resize touch-none',
                'before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-[""]',
                'focus-visible:outline-none'
            )}
        >
            {/* The visible line: the border in rest, the accent while hovered, dragged or focused. */}
            <span
                aria-hidden='true'
                className={cn(
                    'bg-border absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-150',
                    'group-hover:bg-primary group-focus-visible:bg-primary group-active:bg-primary'
                )}
            />
            {/* A grip, faded in on approach so the affordance is discoverable without being noise. */}
            <span
                aria-hidden='true'
                className={cn(
                    'bg-border absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-all duration-200',
                    'group-hover:bg-primary group-hover:opacity-100 group-focus-visible:bg-primary group-focus-visible:opacity-100'
                )}
            />
        </div>
    );
}
