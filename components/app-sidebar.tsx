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
    Settings,
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
}) {
    const groups: NavGroup[] = [
        {
            label: 'Operate',
            items: [
                { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
                ...(showLocations
                    ? [
                          { title: 'Locations', url: '/dashboard/locations', icon: MapPin },
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
            items: [{ title: 'Articles', url: '/dashboard/articles', icon: Newspaper }],
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
    ];

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
