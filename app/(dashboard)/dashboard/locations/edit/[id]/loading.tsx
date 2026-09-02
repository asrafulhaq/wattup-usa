import { PageShell } from '@/components/dashboard/ui/page-shell';
import { LocationFormSkeleton } from '@/components/skeletons/location-form-skeleton';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/** Mirrors the edit page: header carries a view-on-site action, then the same form. */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader actions={1} descriptionWidth='w-80' />
            <LocationFormSkeleton />
        </PageShell>
    );
}
