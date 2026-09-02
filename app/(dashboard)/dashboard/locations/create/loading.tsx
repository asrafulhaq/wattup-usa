import { PageShell } from '@/components/dashboard/ui/page-shell';
import { LocationFormSkeleton } from '@/components/skeletons/location-form-skeleton';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';

/** Mirrors the create page: header, then the tabbed form. */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[560px]' />
            <LocationFormSkeleton />
        </PageShell>
    );
}
