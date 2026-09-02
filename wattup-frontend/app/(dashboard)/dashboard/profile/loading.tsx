import { PageShell } from '@/components/dashboard/ui/page-shell';
import { SkeletonPageHeader } from '@/components/dashboard/ui/skeletons';
import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton';

/** Mirrors the profile page: header, then the two-up cards and the credentials card. */
export default function Loading() {
    return (
        <PageShell>
            <SkeletonPageHeader descriptionWidth='w-[520px]' />
            <ProfileSkeleton />
        </PageShell>
    );
}
