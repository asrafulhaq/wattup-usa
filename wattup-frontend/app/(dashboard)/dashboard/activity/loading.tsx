import { PageShell } from '@/components/dashboard/ui/page-shell';
import { ActivityBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/**
 * Shaped like the page it stands in for: the two tabs, the filter card, then the table.
 * A skeleton that does not match its page is worse than none, because the layout jumps
 * when the real thing lands and it reads as the screen loading twice.
 */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[520px]' />
            <ActivityBodySkeleton />
        </PageShell>
    );
}
