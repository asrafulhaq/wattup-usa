import { PageShell } from '@/components/dashboard/ui/page-shell';
import { UserDetailBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/**
 * The four cards this page renders, at the heights they actually take: a short identity
 * grid, a shorter role row, a long grouped permission list, and the two audit tables
 * that stream in last.
 */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[240px]' />
            <UserDetailBodySkeleton />
        </PageShell>
    );
}
