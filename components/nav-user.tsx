'use client';

import { logout } from '@/app/_actions/auth-actions';
import { ChevronUp, Loader2, LogOut, LucideHome, User2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';

/** Generate up to 2 initials from a display name */
function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
}) {
    const { isMobile, setOpenMobile } = useSidebar();
    const initials = getInitials(user.name);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    };

    const handleOpenChange = (next: boolean) => {
        if (isPending) return; // keep open while signing out
        setOpen(next);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='group h-auto rounded-xl px-3 py-2.5 transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent'>
                            {/* Avatar */}
                            <Avatar className='h-9 w-9 shrink-0 rounded-full ring-2 ring-primary/20'>
                                {user.avatar ? (
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                        className='object-cover'
                                    />
                                ) : null}
                                <AvatarFallback className='rounded-full bg-primary/10 text-primary text-[13px] font-semibold'>
                                    {initials || '?'}
                                </AvatarFallback>
                            </Avatar>

                            {/* Name & Email */}
                            <div className='grid flex-1 text-left leading-snug min-w-0'>
                                <span className='truncate text-sm font-medium text-sidebar-foreground'>
                                    {user.name}
                                </span>
                                <span className='truncate text-xs text-muted-foreground'>
                                    {user.email}
                                </span>
                            </div>

                            <ChevronUp className='ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className='w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl border-border p-1.5 shadow-lg'
                        side={isMobile ? 'bottom' : 'right'}
                        align='end'
                        sideOffset={6}>
                        {/* User identity header */}
                        <DropdownMenuLabel className='p-0 font-normal'>
                            <div className='flex items-center gap-3 px-2 py-2.5'>
                                <Avatar className='h-10 w-10 shrink-0 rounded-full ring-2 ring-primary/20'>
                                    {user.avatar ? (
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name}
                                            className='object-cover'
                                        />
                                    ) : null}
                                    <AvatarFallback className='rounded-full bg-primary/10 text-primary font-semibold'>
                                        {initials || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='grid min-w-0'>
                                    <span className='truncate text-sm font-semibold text-foreground'>
                                        {user.name}
                                    </span>
                                    <span className='truncate text-xs text-muted-foreground'>
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator className='my-1' />

                        <DropdownMenuGroup className='space-y-0.5'>
                            <DropdownMenuItem
                                asChild
                                className='rounded-lg cursor-pointer'>
                                <Link
                                    href='/dashboard/profile'
                                    onClick={() => setOpenMobile(false)}
                                    className='flex items-center gap-2.5 px-2 py-2 text-sm'>
                                    <User2
                                        size={16}
                                        className='text-muted-foreground'
                                    />
                                    Profile Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                asChild
                                className='rounded-lg cursor-pointer'>
                                <Link
                                    href='/'
                                    onClick={() => setOpenMobile(false)}
                                    className='flex items-center gap-2.5 px-2 py-2 text-sm'>
                                    <LucideHome
                                        size={16}
                                        className='text-muted-foreground'
                                    />
                                    Go to Site
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className='my-1' />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={isPending}
                            className='rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive gap-2.5 px-2 py-2 disabled:opacity-60 disabled:cursor-not-allowed'>
                            {isPending
                                ? <Loader2 size={16} className='animate-spin' />
                                : <LogOut size={16} />
                            }
                            {isPending ? 'Signing out…' : 'Sign Out'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

