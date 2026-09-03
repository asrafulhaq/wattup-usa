'use client';

/**
 * The five headline numbers above the document.
 *
 * Same five, same order, same tones as the static tool. They animate on change
 * because they are the thing a user is watching while they type: a figure that
 * moves silently is a figure they miss.
 */
import { motion } from 'framer-motion';

import { usd } from '@/lib/proforma/document';
import type { ProformaModel } from '@/lib/proforma/model';
import { cn } from '@/lib/utils';

type Tone = 'hi' | 'good' | 'warn' | 'plain';

const TONE: Record<Tone, string> = {
    hi: 'text-primary',
    good: 'text-emerald-500',
    warn: 'text-amber-500',
    plain: 'text-foreground',
};

export function KpiStrip({ model }: { model: ProformaModel | null }) {
    if (!model) {
        return (
            <div className='border-border/60 flex shrink-0 overflow-x-auto border-b lg:grid lg:grid-cols-5 lg:overflow-visible'>
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className='border-border/60 min-w-[9.5rem] shrink-0 space-y-2 border-r px-5 py-3.5 last:border-r-0 lg:min-w-0'>
                        <div className='bg-muted h-6 w-28 animate-pulse rounded' />
                        <div className='bg-muted h-2.5 w-20 animate-pulse rounded' />
                    </div>
                ))}
            </div>
        );
    }

    const he = model.host_economics;
    const opx = model.opex;
    const comp = model.competitive;

    const cards: { label: string; value: string; unit?: string; tone: Tone }[] = [
        { label: 'Host revenue / mo', value: usd(he.mrr_y1), tone: 'hi' },
        { label: '10-year host revenue', value: usd(he.ten_yr_total), tone: 'plain' },
        { label: 'vs. flat lease (10-yr)', value: `+${usd(comp.ten_yr_advantage)}`, tone: 'good' },
        { label: 'Operating cost', value: `$${opx.per_kwh.toFixed(4)}`, unit: '/kWh', tone: 'warn' },
        { label: 'OpEx % of gross', value: (opx.pct_gross * 100).toFixed(1), unit: '%', tone: 'warn' },
    ];

    return (
        <div className='border-border/60 flex shrink-0 overflow-x-auto border-b lg:grid lg:grid-cols-5 lg:overflow-visible'>
            {cards.map((c) => (
                <div
                    key={c.label}
                    className='border-border/60 min-w-[9.5rem] shrink-0 border-r px-5 py-3.5 last:border-r-0 lg:min-w-0'
                >
                    <motion.div
                        // Keyed on the value so a change remounts and replays the lift.
                        key={c.value}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        className={cn('truncate text-xl font-bold tabular-nums', TONE[c.tone])}
                    >
                        {c.value}
                        {c.unit ? (
                            <span className='text-muted-foreground ml-0.5 text-xs font-semibold'>
                                {c.unit}
                            </span>
                        ) : null}
                    </motion.div>
                    <div className='text-muted-foreground mt-1 truncate text-[10px] font-medium tracking-wider uppercase'>
                        {c.label}
                    </div>
                </div>
            ))}
        </div>
    );
}
