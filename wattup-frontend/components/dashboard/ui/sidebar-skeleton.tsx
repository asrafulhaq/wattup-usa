import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

/**
 * What the sidebar looks like before the session says which entries to draw.
 *
 * The nav is built from the caller's permissions, so it cannot be prerendered. Its
 * Suspense fallback used to be `null`, and because that boundary is the OUTERMOST
 * pending one on a hard load, React rendered the whole dashboard shell as three empty
 * holes: the prerendered HTML for /dashboard/users was 8 778 bytes of nothing but a
 * <title>, and every route's loading.tsx was serialised into the flight payload and
 * never became HTML. The viewer looked at a blank page until the session round trips
 * finished, about 560 ms locally and one full server round trip in production.
 *
 * This holds no permission data, so Next prerenders it into the shell and the frame is
 * on screen at TTFB. It deliberately uses the same Sidebar primitives, at the same
 * variant, rather than a hand rolled box: the width, the inset offset and the header and
 * footer paddings then come from one definition and cannot drift from the real thing.
 *
 * The logo is the real logo. It is unconditional in AppSidebar, so drawing a grey pill
 * where the logo will land would be a worse likeness than the logo itself.
 *
 * Row counts are the shape a SUPER_ADMIN sees, which is the most entries any role gets:
 * Operate 3, Content 1, Account 4, Configure 1. A role with fewer sees the list shorten
 * when the session lands, which reads as loading. Guessing low and having it grow would
 * push the footer down the screen instead.
 */
const GROUPS = [
    { width: 'w-14', rows: 3 },
    { width: 'w-16', rows: 1 },
    { width: 'w-16', rows: 4 },
    { width: 'w-20', rows: 1 },
];

export function SidebarSkeleton() {
    return (
        <Sidebar collapsible='offcanvas' variant='inset'>
            <SidebarHeader className='px-3 pt-4 pb-2'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className='block px-1'>
                            <Image
                                src={'/assets/images/shared/logo_dark.svg'}
                                alt='WattUp'
                                width={116}
                                height={41}
                                priority
                                style={{ width: 116, height: 'auto' }}
                            />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className='px-2'>
                {GROUPS.map((group, groupIndex) => (
                    <SidebarGroup key={groupIndex} className='gap-1 py-1'>
                        {/* dash-eyebrow is 11px uppercase; the pill matches its box. */}
                        <div className='px-3 pt-3 pb-1.5'>
                            <Skeleton className={`h-[11px] ${group.width}`} />
                        </div>
                        <SidebarGroupContent>
                            <SidebarMenu className='gap-0.5'>
                                {Array.from({ length: group.rows }).map((_, row) => (
                                    <SidebarMenuItem key={row}>
                                        {/* h-9 rounded-[9px] px-3, the SidebarMenuButton box. */}
                                        <div className='flex h-9 items-center gap-2 rounded-[9px] px-3'>
                                            <Skeleton className='size-4 shrink-0 rounded-[4px]' />
                                            <Skeleton className='h-[14px] w-24' />
                                        </div>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className='border-t border-dash-border p-2'>
                {/* Mirrors NavUser: 32px avatar, name over email, a trailing chevron. */}
                <div className='flex h-12 items-center gap-2 rounded-[9px] px-2'>
                    <Skeleton className='size-8 shrink-0 rounded-lg' />
                    <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                        <Skeleton className='h-[13px] w-24' />
                        <Skeleton className='h-3 w-32' />
                    </div>
                    <Skeleton className='size-4 shrink-0 rounded-[4px]' />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
