import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton counterparts to the dashboard primitives.
 *
 * Each one mirrors the real component's box model, not a rough approximation of it: the
 * same paddings, the same heights, the same grid. That is the whole point of a loading
 * state. If the skeleton is a different shape, the content jumps when it arrives, and a
 * jump reads as a bug rather than as loading.
 *
 * They live next to the components they mirror so the pair is edited together.
 */

/** Mirrors PageHeader: 26px title, 14px description, 40px action buttons. */
export function SkeletonPageHeader({
    actions = 0,
    descriptionWidth = 'w-96',
}: {
    actions?: number;
    descriptionWidth?: string;
}) {
    return (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            {/* Measured against the real PageHeader rather than eyeballed: the h1 is
                26px at leading-tight, which computes to 32.5px, the description is
                text-sm on a 20px line box, and the gap between them is mt-1.5. Total
                58.5px, so the card below lands where it will actually land. */}
            <div className='min-w-0'>
                <Skeleton className='h-[32.5px] w-56' />
                <Skeleton className={`mt-1.5 h-5 ${descriptionWidth}`} />
            </div>
            {actions > 0 && (
                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                    {Array.from({ length: actions }).map((_, i) => (
                        <Skeleton key={i} className='h-10 w-40 rounded-[10px]' />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Mirrors StatCard: 36px icon chip, 28px value, 13px label, 12px hint. */
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className='dash-card p-5'>
                    <Skeleton className='size-9 rounded-[10px]' />
                    <Skeleton className='mt-4 h-7 w-24' />
                    <Skeleton className='mt-2.5 h-[13px] w-28' />
                    <Skeleton className='mt-2 h-3 w-36' />
                </div>
            ))}
        </div>
    );
}

/** Mirrors SectionCard: header px-5 pt-5 pb-4, body px-5 pb-5. */
export function SkeletonSectionCard({
    rows = 4,
    rowHeight = 'h-[38px]',
    className = '',
}: {
    rows?: number;
    rowHeight?: string;
    className?: string;
}) {
    return (
        <section className={`dash-card overflow-hidden ${className}`}>
            <header className='px-5 pt-5 pb-4'>
                <Skeleton className='h-[18px] w-44' />
                <Skeleton className='mt-2 h-[13px] w-72' />
            </header>
            <div className='flex flex-col gap-3.5 px-5 pb-5'>
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className={`${rowHeight} w-full`} />
                ))}
            </div>
        </section>
    );
}

/** Mirrors the quick-link cards at the foot of the overview. */
export function SkeletonQuickLinks({ count = 3 }: { count?: number }) {
    return (
        <div className='grid gap-4 sm:grid-cols-3'>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className='dash-card flex flex-col gap-2 p-5'>
                    <Skeleton className='size-9 rounded-[10px]' />
                    <Skeleton className='mt-1 h-[14px] w-24' />
                    <Skeleton className='h-3 w-full' />
                </div>
            ))}
        </div>
    );
}

/** Mirrors the DataTable toolbar: search left, filters and action right. */
export function SkeletonToolbar({
    filters = 0,
    action = true,
}: {
    filters?: number;
    action?: boolean;
}) {
    return (
        <div className='flex items-center justify-between gap-2'>
            <Skeleton className='h-10 w-full max-w-sm rounded-[10px]' />
            <div className='flex items-center gap-2'>
                {Array.from({ length: filters }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-44 rounded-[10px]' />
                ))}
                {action && <Skeleton className='h-10 w-36 rounded-[10px]' />}
            </div>
        </div>
    );
}

/**
 * Mirrors a table inside a dash-card: 44px header, 61px rows.
 *
 * `columns` are relative widths, so the skeleton's columns land under the real headings
 * rather than at even intervals.
 */
export function SkeletonTableCard({
    columns = [3, 1, 1, 1, 1],
    rows = 10,
    leading = 'checkbox',
}: {
    columns?: number[];
    rows?: number;
    leading?: 'checkbox' | 'none';
}) {
    const template = `${leading === 'checkbox' ? '24px ' : ''}${columns
        .map(c => `${c}fr`)
        .join(' ')}`;

    return (
        <div className='dash-card overflow-hidden'>
            <div
                className='grid h-11 items-center gap-4 border-b border-dash-border bg-dash-canvas/70 px-4'
                style={{ gridTemplateColumns: template }}>
                {leading === 'checkbox' && <Skeleton className='size-4 rounded-[4px]' />}
                {columns.map((_, i) => (
                    <Skeleton key={i} className='h-[11px] w-16' />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={r}
                    className='grid h-[61px] items-center gap-4 border-b border-dash-border px-4 last:border-0'
                    style={{ gridTemplateColumns: template }}>
                    {leading === 'checkbox' && (
                        <Skeleton className='size-4 rounded-[4px]' />
                    )}
                    {columns.map((_, c) => (
                        <div key={c}>
                            {c === 0 ? (
                                <div className='flex flex-col gap-1.5'>
                                    <Skeleton className='h-[14px] w-40' />
                                    <Skeleton className='h-3 w-28' />
                                </div>
                            ) : (
                                <Skeleton className='h-[14px] w-16' />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Mirrors the DataTable pagination footer. */
export function SkeletonPagination() {
    return (
        <div className='flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row'>
            <Skeleton className='h-[13px] w-44' />
            <div className='flex items-center gap-6 lg:gap-8'>
                <div className='flex items-center gap-2'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-8 w-[70px] rounded-md' />
                </div>
                <Skeleton className='h-3 w-20' />
                <div className='flex items-center gap-1'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className='size-8 rounded-md' />
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Mirrors the tab strip on the location form and settings. */
export function SkeletonTabs({ widths }: { widths: number[] }) {
    return (
        <div className='flex h-10 w-fit items-center gap-1 rounded-[10px] border border-dash-border bg-dash-surface p-1'>
            {widths.map((w, i) => (
                <Skeleton key={i} className='h-8 rounded-[7px]' style={{ width: w }} />
            ))}
        </div>
    );
}
