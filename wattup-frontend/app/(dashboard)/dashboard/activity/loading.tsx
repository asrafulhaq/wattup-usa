import { PageShell } from '@/components/dashboard/ui/page-shell';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/**
 * The activity page reads a page of the log and the distinct apps and events behind the
 * filters, so it is worth a skeleton shaped like what arrives: the tabs, the filter bar,
 * then a table.
 */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[460px]' />
            <div className='flex gap-2'>
                <div className='h-9 w-28 animate-pulse rounded-lg bg-dash-canvas' />
                <div className='h-9 w-24 animate-pulse rounded-lg bg-dash-canvas' />
            </div>
            <div className='h-[86px] w-full animate-pulse rounded-xl border border-dash-border bg-dash-canvas' />
            <div className='overflow-hidden rounded-lg border border-dash-border'>
                <div className='h-10 border-b border-dash-border bg-dash-canvas/60' />
                {Array.from({ length: 8 }, (_, row) => (
                    <div key={row} className='flex gap-4 border-b border-dash-border px-4 py-3 last:border-0'>
                        <div className='h-4 w-32 animate-pulse rounded bg-dash-canvas' />
                        <div className='h-4 w-48 animate-pulse rounded bg-dash-canvas' />
                        <div className='h-4 w-20 animate-pulse rounded bg-dash-canvas' />
                        <div className='h-4 flex-1 animate-pulse rounded bg-dash-canvas' />
                    </div>
                ))}
            </div>
        </PageShell>
    );
}
