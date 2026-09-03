'use client';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
    title: string;
    url: string;
    icon?: React.ElementType;
    prefetch?: boolean;
}

export interface NavGroup {
    /** The small uppercase label above the group. Omit for an ungrouped run. */
    label?: string;
    items: NavItem[];
}

/**
 * Picks the one active entry.
 *
 * Longest matching url wins, so /dashboard/locations/amenities highlights Amenities
 * rather than Locations, while /dashboard/locations/create still highlights Locations.
 * A plain `startsWith` per item lights up both, and an exact match lights up neither on
 * a nested page.
 */
function activeUrl(pathname: string, groups: NavGroup[]): string | null {
    const urls = groups.flatMap(group => group.items.map(item => item.url));
    return (
        urls
            .filter(url => pathname === url || pathname.startsWith(`${url}/`))
            .sort((a, b) => b.length - a.length)[0] ?? null
    );
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const current = activeUrl(pathname, groups);

    // A single running index across groups, so the entrance stagger reads down the
    // whole sidebar rather than restarting at each heading.
    let index = 0;

    return (
        <>
            {groups.map((group, groupIndex) => (
                <SidebarGroup key={group.label ?? groupIndex} className='gap-1 py-1'>
                    {group.label && (
                        <div className='dash-eyebrow px-3 pt-3 pb-1.5'>{group.label}</div>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className='gap-0.5'>
                            {group.items.map(item => {
                                const isActive = current === item.url;
                                const Icon = item.icon;
                                const style = {
                                    '--nav-index': index++,
                                } as React.CSSProperties;

                                return (
                                    <SidebarMenuItem
                                        key={item.url}
                                        className='wattup-nav-item'
                                        style={style}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`h-9 rounded-[9px] px-3 text-[14px] font-normal transition-colors ${
                                                isActive
                                                    ? 'bg-primary/8 text-primary hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/8 data-[active=true]:text-primary'
                                                    : 'text-dash-body hover:bg-dash-canvas hover:text-dash-heading'
                                            }`}>
                                            <Link
                                                href={item.url}
                                                // Prefetch every dashboard link, not
                                                // just the one that asked for it. The
                                                // pages are behind auth so none of them
                                                // is statically cached, and the payload
                                                // a hover fetches is the round trip the
                                                // click would otherwise wait for. There
                                                // are nine of them, all small.
                                                prefetch={item.prefetch ?? true}
                                                onClick={() => setOpenMobile(false)}>
                                                {Icon && (
                                                    <Icon
                                                        className={
                                                            isActive
                                                                ? 'text-primary'
                                                                : 'text-dash-faint'
                                                        }
                                                    />
                                                )}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
