import { PageShell } from '@/components/dashboard/ui/page-shell';
import { ArticlesBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-80' />
            <ArticlesBodySkeleton />
        </PageShell>
    );
}
