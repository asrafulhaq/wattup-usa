'use client';

import * as React from 'react';

import { NavMain, type NavGroup } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    ConciergeBell,
    LayoutDashboard,
    MapPin,
    Newspaper,
    ScrollText,
    Settings,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Grouped rather than one flat list.
 *
 * Seven entries in a row gives no clue which belong together, and the list only grows.
 * The headings say what each run is for, so a new entry has an obvious home and the
 * reader can skip whole sections rather than scanning every label.
 */
export function AppSidebar({
    user,
    showUsers,
    showSettings,
    showLocations,
    showAmenities,
    showArticles,
    showActivity,
    showRoles,
    ...props
}: React.ComponentProps<typeof Sidebar> & {
    user: {
        name?: string | null;
        email?: string | null;
        avatar?: string | null;
        image?: string | null;
    };
    showUsers?: boolean;
    showSettings?: boolean;
    showLocations?: boolean;
    showAmenities?: boolean;
    showArticles?: boolean;
    showActivity?: boolean;
    showRoles?: boolean;
}) {
    const groups: NavGroup[] = [
        {
            label: 'Operate',
            items: [
                { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
                ...(showLocations
                    ? [{ title: 'Locations', url: '/dashboard/locations', icon: MapPin }]
                    : []),
                // Its own permission, not Locations'. The amenity catalogue is network
                // wide, and a role that may see sites is not necessarily one that may
                // restructure the list every site draws from.
                ...(showAmenities
                    ? [
                          {
                              title: 'Amenities',
                              url: '/dashboard/locations/amenities',
                              // A concierge bell, not sparkles: these are the facilities
                              // on site, and sparkles reads as "featured" or "AI".
                              icon: ConciergeBell,
                          },
                      ]
                    : []),
            ],
        },
        {
            label: 'Content',
            // Articles was the one entry shown to everybody. A role with no content
            // permission at all, SALES for instance, saw it and got NoAccess on click.
            items: showArticles
                ? [{ title: 'Articles', url: '/dashboard/articles', icon: Newspaper }]
                : [],
        },
        {
            label: 'Account',
            items: [
                { title: 'Profile', url: '/dashboard/profile', icon: UserRound },
                ...(showUsers
                    ? [
                          {
                              title: 'Users',
                              url: '/dashboard/users',
                              icon: UsersRound,
                              prefetch: true as const,
                          },
                      ]
                    : []),
                // Under Account beside Users, because it answers the same question one
                // level up: Users is who may sign in, Roles is what each of them may do.
                ...(showRoles
                    ? [{ title: 'Roles', url: '/dashboard/roles', icon: ShieldCheck }]
                    : []),
                // The whole audit trail, both applications. The per-person view lives on
                // a user's page; this is the same data unfiltered.
                ...(showActivity
                    ? [{ title: 'Activity', url: '/dashboard/activity', icon: ScrollText }]
                    : []),
            ],
        },
        ...(showSettings
            ? [
                  {
                      label: 'Configure',
                      items: [
                          // A gear, not sliders: Settings2 is a mixer, which reads as filters.
                          { title: 'Settings', url: '/dashboard/settings', icon: Settings },
                      ],
                  },
              ]
            : []),
    ]
        // A group whose every entry was filtered out would render as a heading with
        // nothing under it, which tells the viewer exactly what they cannot reach.
        .filter(group => group.items.length > 0);

    const userData = {
        name: user.name || 'Admin',
        email: user.email || '',
        avatar: user.avatar || user.image || '',
    };

    return (
        <Sidebar collapsible='offcanvas' {...props}>
            <SidebarHeader className='px-3 pt-4 pb-2'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href='/dashboard' className='block px-1'>
                            <Image
                                src={'/assets/images/shared/logo_dark.svg'}
                                alt='WattUp'
                                width={116}
                                height={41}
                                priority
                                style={{ width: 116, height: 'auto' }}
                            />
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className='px-2'>
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter className='border-t border-dash-border p-2'>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    );
}
