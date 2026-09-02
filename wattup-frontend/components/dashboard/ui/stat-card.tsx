import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export type StatTone = 'accent' | 'emerald' | 'amber' | 'slate' | 'violet';

const TONES: Record<StatTone, string> = {
    accent: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-50 text-violet-600',
};

/**
 * One number, with enough around it to mean something.
 *
 * The sub-label is not decoration: a bare count invites the reader to guess what it
 * counts, and on a network where eleven sites are open and sixteen are not, guessing
 * wrong matters.
 */
export function StatCard({
    icon: Icon,
    tone = 'accent',
    value,
    label,
    hint,
    delta,
}: {
    icon: LucideIcon;
    tone?: StatTone;
    value: string | number;
    label: string;
    hint?: string;
    /** Signed percentage or count change. Positive is not always good, so tone follows sign only. */
    delta?: { value: string; direction: 'up' | 'down' } | null;
}) {
    const DeltaIcon = delta?.direction === 'down' ? TrendingDown : TrendingUp;

    return (
        <div className='dash-card p-5'>
            <div className='flex items-start justify-between'>
                <span
                    className={`flex size-9 items-center justify-center rounded-[10px] ${TONES[tone]}`}>
                    <Icon className='size-[18px]' />
                </span>
                {delta && (
                    <span
                        className={`flex items-center gap-1 text-[12px] font-medium ${
                            delta.direction === 'down'
                                ? 'text-rose-500'
                                : 'text-emerald-600'
                        }`}>
                        <DeltaIcon className='size-3.5' />
                        {delta.value}
                    </span>
                )}
            </div>

            <p className='dash-num mt-4 text-[28px] leading-none font-semibold tracking-[-0.02em] text-dash-heading'>
                {value}
            </p>
            <p className='mt-2 text-[13px] font-medium text-dash-body'>{label}</p>
            {hint && <p className='mt-1 text-[12px] text-dash-faint'>{hint}</p>}
        </div>
    );
}
