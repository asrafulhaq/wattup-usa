'use client';

import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { FileText, LayoutGrid, Settings2, User2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const baseNav = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    { title: 'Articles', url: '/dashboard/articles', icon: FileText },
    { title: 'Profile', url: '/dashboard/profile', icon: User2 },
];

export function AppSidebar({
    user,
    showUsers,
    showSettings,
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
}) {
    const { setOpenMobile } = useSidebar();

    const navItems = [
        ...baseNav,
        ...(showSettings ? [{ title: 'Settings', url: '/dashboard/settings', icon: Settings2 }] : []),
        ...(showUsers ? [{ title: 'Users', url: '/dashboard/users', icon: Users, prefetch: true as const }] : []),
    ];

    const userData = {
        name: user.name || 'Admin',
        email: user.email || '',
        avatar: user.avatar || user.image || '',
    };

    return (
        <Sidebar collapsible='offcanvas' {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size='lg'
                            className='data-[slot=sidebar-menu-button]:p-1.5!'>
                            <Link href='/dashboard'>
                                <Image
                                    src={'/assets/images/shared/logo_dark.svg'}
                                    alt='WattUp Logo'
                                    width={130}
                                    height={46}
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    );
}

