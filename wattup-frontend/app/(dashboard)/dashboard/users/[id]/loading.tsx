import { PageShell } from '@/components/dashboard/ui/page-shell';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/**
 * The detail page reads a user, their permission provenance and two pages of the audit
 * log, so it is worth a skeleton rather than a blank screen. Four cards, matching the
 * four sections the page renders.
 */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[280px]' />
            {[0, 1, 2, 3].map(card => (
                <div
                    key={card}
                    className='flex flex-col gap-3 rounded-xl border border-dash-border bg-white p-5'
                >
                    <div className='h-4 w-32 animate-pulse rounded bg-dash-canvas' />
                    <div className='h-3 w-64 animate-pulse rounded bg-dash-canvas' />
                    <div className='mt-2 flex flex-col gap-2'>
                        {[0, 1, 2].map(line => (
                            <div key={line} className='h-9 w-full animate-pulse rounded bg-dash-canvas' />
                        ))}
                    </div>
                </div>
            ))}
        </PageShell>
    );
}
