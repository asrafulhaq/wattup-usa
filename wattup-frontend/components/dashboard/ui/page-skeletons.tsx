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

// ── Roles ────────────────────────────────────────────────────────────────────
/** Permission, then one column per role: five of them, all the same width. */
export function RolesBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            {/* 21 permission rows plus seven group headings, so the footnote below the
                table lands where it will actually land. */}
            <SkeletonTableCard columns={[3, 1, 1, 1, 1, 1]} rows={28} leading='none' />
            <Skeleton className='h-3 w-[520px]' />
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

// ── Activity ─────────────────────────────────────────────────────────────────
/**
 * The Activity screen: two tab buttons, the filter card, then the table.
 *
 * Matched to what actually renders, because a skeleton whose shape differs from the page
 * is worse than none: the layout jumps when the real thing arrives, which reads as the
 * page loading twice.
 */
export function ActivityBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            {/* Everything / Sign-ins */}
            <div className='flex items-center gap-2'>
                <Skeleton className='h-[34px] w-[104px] rounded-lg' />
                <Skeleton className='h-[34px] w-[86px] rounded-lg' />
            </div>

            {/* The filter card: three labelled controls in a bordered box. */}
            <div className='dash-card flex flex-wrap items-end gap-3 p-4'>
                {[
                    [86, 132],
                    [46, 132],
                    [126, 224],
                ].map(([label, control], i) => (
                    <div key={i} className='flex flex-col gap-1.5'>
                        <Skeleton className='h-[11px]' style={{ width: label }} />
                        <Skeleton className='h-9 rounded-lg' style={{ width: control }} />
                    </div>
                ))}
            </div>

            {/* When, Who, App, Event, Detail. */}
            <SkeletonTableCard columns={[1.4, 2, 1, 1.4, 2]} rows={10} leading='checkbox' />
        </div>
    );
}

// ── One team member ──────────────────────────────────────────────────────────
/**
 * The user detail page: the back link, then four cards whose heights follow the real
 * ones. Identity is short, Role is shorter, Permissions is long, and the two audit
 * tables stream in after the rest, so they are drawn as tables rather than as blocks.
 */
export function UserDetailBodySkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <Skeleton className='h-[14px] w-28' />

            {/* Identity: avatar beside a grid of six short fields. */}
            <div className='dash-card flex flex-col gap-3 p-5'>
                <Skeleton className='h-[18px] w-24' />
                <div className='flex items-start gap-4'>
                    <Skeleton className='size-14 shrink-0 rounded-full' />
                    <div className='grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3'>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className='flex flex-col gap-1.5'>
                                <Skeleton className='h-[11px] w-16' />
                                <Skeleton className='h-[14px] w-28' />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Role: heading, one line, then a badge, a select and a button. */}
            <div className='dash-card flex flex-col gap-3 p-5'>
                <Skeleton className='h-[18px] w-14' />
                <Skeleton className='h-[14px] w-[420px]' />
                <div className='flex items-center gap-3'>
                    <Skeleton className='h-[26px] w-20 rounded-full' />
                    <Skeleton className='h-9 w-40 rounded-lg' />
                    <Skeleton className='h-9 w-28 rounded-lg' />
                </div>
            </div>

            {/* Permissions: grouped rows, each with a three-button control on the right. */}
            <div className='dash-card flex flex-col gap-4 p-5'>
                <Skeleton className='h-[18px] w-28' />
                <Skeleton className='h-[14px] w-[460px]' />
                {[4, 4].map((count, group) => (
                    <div key={group} className='flex flex-col gap-2'>
                        <Skeleton className='h-[14px] w-32' />
                        <Skeleton className='h-3 w-64' />
                        <div className='overflow-hidden rounded-lg border border-dash-border'>
                            {Array.from({ length: count }).map((_, row) => (
                                <div
                                    key={row}
                                    className='flex items-center justify-between gap-3 border-b border-dash-border px-4 py-3 last:border-0'>
                                    <div className='flex flex-col gap-1.5'>
                                        <Skeleton className='h-[14px] w-56' />
                                        <Skeleton className='h-3 w-72' />
                                    </div>
                                    <Skeleton className='h-[30px] w-[196px] shrink-0 rounded-lg' />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* The two audit tables, which stream in last. */}
            {[
                [1.4, 1, 1.4, 2],
                [1.4, 1, 1.4, 1, 2],
            ].map((columns, i) => (
                <div key={i} className='dash-card flex flex-col gap-3 p-5'>
                    <Skeleton className='h-[18px] w-32' />
                    <Skeleton className='h-[14px] w-[440px]' />
                    <SkeletonTableCard columns={columns} rows={5} leading='none' />
                </div>
            ))}
        </div>
    );
}

// ── The layout's own fallback ─────────────────────────────────────────────────

/**
 * The shape of "a dashboard screen", for the one boundary that cannot know which screen.
 *
 * components/dashboard/dashbaord-wrapper.tsx wraps every route's children in a Suspense
 * that awaits the session. That boundary is the OUTERMOST pending one on a hard load, so
 * React renders ITS fallback and not the route's loading.tsx, which sits a level deeper.
 * While the fallback was `null` that meant every dashboard page prerendered as an empty
 * hole: 8 778 bytes of HTML whose only visible text was the <title>, zero animate-pulse,
 * and the route's real skeleton serialised into the flight payload where nobody saw it.
 *
 * This one cannot be route specific, because the layout renders before the route's
 * segment is resolved. It is the shell, a header and one table card: the shape ten of
 * the fourteen dashboard routes actually have. On client side navigation the layout is
 * not re-rendered, so each route's own loading.tsx still shows, unchanged.
 *
 * Nothing here reads the session, so Next prerenders it into the static shell.
 */
export function DashboardBodySkeleton() {
    return (
        <PageShell>
            <SkeletonPageHeader actions={1} descriptionWidth='w-[480px]' />
            <div className='flex flex-col gap-4'>
                <SkeletonToolbar filters={1} />
                <SkeletonTableCard columns={[3, 1, 1, 1, 1]} rows={8} leading='none' />
            </div>
        </PageShell>
    );
}
