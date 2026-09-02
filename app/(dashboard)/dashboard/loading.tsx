import { OverviewPageSkeleton } from '@/components/dashboard/ui/page-skeletons';

/**
 * The instant answer to a dashboard navigation.
 *
 * Next swaps the route segment for this the moment a link is clicked, without waiting on
 * the server. There was no loading file anywhere under /dashboard before, so every
 * navigation sat on the old screen until the whole payload arrived.
 *
 * The shape is shared with the page's own Suspense fallback, so the two cannot drift.
 */
export default function Loading() {
    return <OverviewPageSkeleton />;
}
