'use client';

import { IconChevronRight } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { RevealList } from './reveal-animation';

export function NavMain({
    items,
}: {
    items: {
        title: string;
        url: string;
        icon?: React.ElementType;
        prefetch?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
}) {
    const { setOpenMobile } = useSidebar();
    return (
        <SidebarGroup>
            <SidebarGroupContent className='flex flex-col gap-2'>
                <SidebarMenu>
                    <RevealList staggerDelay={0.05} delay={0.1}>
                        {items.map(item => (
                            <NavItem key={item.title} item={item} />
                        ))}
                    </RevealList>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function NavItem({
    item,
}: {
    item: {
        title: string;
        url: string;
        icon?: React.ElementType;
        prefetch?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    };
}) {
    const { setOpenMobile } = useSidebar();
    const pathname = usePathname();
    const isActive = item.url !== '#' && pathname === item.url;
    const isSubActive = item.items?.some(sub => sub.url === pathname);
    const [isOpen, setIsOpen] = useState(isSubActive);

    useEffect(() => {
        if (isSubActive && !isOpen) {
            const t = setTimeout(() => setIsOpen(true), 0);
            return () => clearTimeout(t);
        }
    }, [isSubActive, isOpen]);

    if (item.items?.length) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    className='font-normal! text-dark/70'
                    tooltip={item.title}
                    onClick={() => setIsOpen(!isOpen)}
                    isActive={isActive || isSubActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <IconChevronRight
                        className={`ml-auto size-4 transition-transform ${
                            isOpen ? 'rotate-90' : ''
                        }`}
                    />
                </SidebarMenuButton>
                {isOpen && (
                    <SidebarMenuSub>
                        {item.items.map(subItem => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.url}>
                                    <Link
                                        href={subItem.url}
                                        onClick={() => setOpenMobile(false)}>
                                        <span>{subItem.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                )}
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className='font-normal!'>
                <Link href={item.url} prefetch={item.prefetch} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

