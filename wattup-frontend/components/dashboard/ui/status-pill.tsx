export type PillTone = 'live' | 'progress' | 'idle' | 'muted' | 'danger';

const TONES: Record<PillTone, { wrap: string; dot: string }> = {
    live: { wrap: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
    progress: { wrap: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
    idle: { wrap: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    muted: { wrap: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
    danger: { wrap: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' },
};

/**
 * A state, with a dot.
 *
 * The dot carries the meaning as well as the colour does, which is what keeps the
 * distinction between "Open" and "Coming soon" legible to someone who cannot tell
 * green from amber.
 */
export function StatusPill({
    tone,
    children,
}: {
    tone: PillTone;
    children: React.ReactNode;
}) {
    const style = TONES[tone];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ${style.wrap}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {children}
        </span>
    );
}
