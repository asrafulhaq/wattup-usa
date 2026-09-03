'use client';

/**
 * One collapsible section of the control rail, animated with Motion.
 *
 * This replaced the Radix accordion + CSS keyframes, for one reason that only
 * shows up in use: a CSS animation cannot be interrupted gracefully. Click a
 * section twice quickly, or open one while another is still closing, and the
 * keyframe restarts from its own beginning, which is the jerk you feel. A spring
 * is stateful: it keeps the current height and velocity and retargets, so a
 * change of mind mid-flight stays continuous.
 *
 * Motion also animates to `height: auto` honestly, measuring the content itself,
 * so a section whose height changes while open (adding a gallery image, the EVpin
 * status appearing) settles rather than jumping.
 *
 * The ARIA is written out by hand because this is no longer Radix: the trigger is
 * a button that owns the region, `aria-expanded` reflects state, and the panel is
 * labelled by its trigger. The `data-slot` names are kept so anything written
 * against the previous markup still matches.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface RailSectionProps {
    id: string;
    /** The badge number, '0' through '7'. */
    n: string;
    title: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export function RailSection({ id, n, title, open, onToggle, children }: RailSectionProps) {
    const reduced = useReducedMotion();
    const panelId = `rail-panel-${id}`;
    const triggerId = `rail-trigger-${id}`;

    /**
     * Stiff enough to feel immediate, damped enough never to overshoot: a panel
     * full of numbers that bounces reads as a bug rather than as polish.
     */
    const spring = reduced
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 420, damping: 42, mass: 0.9 };

    return (
        <div data-slot='accordion-item' data-state={open ? 'open' : 'closed'} className='border-border/60 border-b px-4 last:border-b-0'>
            <h3 className='flex'>
                <button
                    type='button'
                    id={triggerId}
                    data-slot='accordion-trigger'
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={onToggle}
                    className={cn(
                        'focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-3 rounded-md py-3.5 text-left outline-none focus-visible:ring-[3px]'
                    )}
                >
                    <span className='flex min-w-0 items-center gap-2.5'>
                        <span className='bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums'>
                            {n}
                        </span>
                        <span className='truncate text-[13px] font-semibold tracking-wide uppercase'>
                            {title}
                        </span>
                    </span>
                    <motion.span
                        aria-hidden='true'
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                        className='text-muted-foreground flex shrink-0'
                    >
                        <ChevronDown className='size-4' />
                    </motion.span>
                </button>
            </h3>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        key='panel'
                        id={panelId}
                        role='region'
                        aria-labelledby={triggerId}
                        data-slot='accordion-content'
                        data-state='open'
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: spring,
                            // Opacity leads slightly on the way in and leaves first on
                            // the way out, so the panel never reads as an empty box
                            // being stretched.
                            opacity: reduced ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                        }}
                        // Opening one section reflows the seven below it; containment
                        // lets the browser treat this panel as its own layout root.
                        style={{ overflow: 'hidden', contain: 'layout paint' }}
                    >
                        <div className='space-y-3.5 pb-5'>{children}</div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
