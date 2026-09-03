import { BuilderSkeleton } from '@/components/builder/builder-skeleton';

/**
 * Shown while the page's membership check runs on the server. The same component
 * the builder shows for its own first frame, so the two cannot drift apart.
 */
export default function Loading() {
    return <BuilderSkeleton />;
}
