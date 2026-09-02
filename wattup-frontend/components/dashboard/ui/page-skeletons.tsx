import { PageShell } from '@/components/dashboard/ui/page-shell';
import {
    SkeletonPageHeader,
    SkeletonPagination,
    SkeletonQuickLinks,
    SkeletonSectionCard,
    SkeletonStatCards,
    SkeletonTableCard,
    SkeletonToolbar,
} from '@/components/dashboard/ui/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The loading shape of each screen, defined once.
 *
 * Every dashboard page shows its skeleton twice: `loading.tsx` on navigation, and a
 * Suspense fallback while its data streams. Written separately they drift, and a
 * skeleton that no longer matches its page is worse than none, because the content
 * visibly jumps when it lands.
 *
 * So the body of each screen lives here and both callers use it. `loading.tsx` adds the
 * shell and the header, since it stands in for the whole route; the in-page fallback
 * takes the body alone, because the real header is already on screen beside it.
 */

// ── Overview ─────────────────────────────────────────────────────────────────
export function OverviewBodySkeleton() {
    return (
        <>
            <SkeletonStatCards count={4} />
            <div className='grid gap-4 lg:grid-cols-[1.4fr_1fr]'>
                <SkeletonSectionCard rows={2} rowHeight='h-[46px]' />
                <SkeletonSectionCard rows={5} rowHeight='h-[26px]' />
            </div>
            <SkeletonQuickLinks count={3} />
        </>
    );
}

export function OverviewPageSkeleton() {
    return (
        <PageShell>
            <SkeletonPageHeader actions={1} />
            <OverviewBodySkeleton />
        </PageShell>
    );
}

// ── Locations ────────────────────────────────────────────────────────────────
/** Site, Status, Bays, Power, Price, Amenities, On the site, actions. */
const LOCATION_COLUMNS = [3, 1.1, 0.7, 0.8, 0.8, 1, 1, 1.1];

export function LocationsBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <SkeletonToolbar filters={2} />
            {/* Twenty, matching the page size, so the footer does not slide down the
                screen when the data arrives. */}
            <SkeletonTableCard columns={LOCATION_COLUMNS} rows={20} />
            <SkeletonPagination />
            <Skeleton className='h-3 w-[420px]' />
        </div>
    );
}

// ── Amenities ────────────────────────────────────────────────────────────────
/** Order, Amenity, Slug, Sites, Shown, actions. */
const AMENITY_COLUMNS = [0.7, 2, 1.4, 0.7, 0.7, 0.8];

export function AmenitiesBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex justify-end'>
                <Skeleton className='h-10 w-36 rounded-[10px]' />
            </div>
            <SkeletonTableCard columns={AMENITY_COLUMNS} rows={15} leading='none' />
        </div>
    );
}

// ── Articles ─────────────────────────────────────────────────────────────────
export function ArticlesBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <SkeletonToolbar filters={0} />
            <SkeletonTableCard columns={[3, 1, 1, 1, 1, 0.8]} rows={10} />
            <SkeletonPagination />
        </div>
    );
}

// ── Team ─────────────────────────────────────────────────────────────────────
export function UsersBodySkeleton() {
    return (
        <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-between gap-4'>
                <Skeleton className='h-[13px] w-36' />
                <Skeleton className='h-9 w-32 rounded-md' />
            </div>
            {/* User, Role, Status, Joined, actions. */}
            <SkeletonTableCard columns={[3, 1, 1, 1, 0.6]} rows={6} leading='none' />
        </div>
    );
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function SettingsBodySkeleton() {
    return (
        <div className='flex flex-col gap-5'>
            <div className='flex justify-end border-b border-dash-border py-3'>
                <Skeleton className='h-9 w-44 rounded-md' />
            </div>
            <div className='flex h-10 w-fit items-center gap-1 rounded-[10px] border border-dash-border bg-dash-surface p-1'>
                {[74, 118, 116, 118].map((w, i) => (
                    <Skeleton key={i} className='h-8 rounded-[7px]' style={{ width: w }} />
                ))}
            </div>
            <div className='dash-card mt-4'>
                <div className='space-y-2 border-b border-dash-border p-6'>
                    <Skeleton className='h-[18px] w-44' />
                    <Skeleton className='h-[14px] w-80' />
                </div>
                <div className='space-y-5 p-6'>
                    {[0, 1, 2].map(i => (
                        <div key={i} className='space-y-2'>
                            <Skeleton className='h-[14px] w-40' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
