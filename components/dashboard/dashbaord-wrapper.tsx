/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminSession } from '@/app/_actions/auth-actions';
import { getProfile } from '@/app/_actions/userActions';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardFadeIn } from '@/components/dashboard/dashboard-fade-in';
import { SiteHeader } from '@/components/site-header';
import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import React, { Suspense } from 'react';

async function SidebarWrapper() {
    const [profile, admin] = await Promise.all([
        getProfile(),
        getAdminSession(),
    ]);

    // profile.image is stored as Json: { url, public_id } or a plain string or null
    const profileImageUrl =
        profile?.image &&
        typeof profile.image === 'object' &&
        'url' in profile.image
            ? (profile.image as { url: string }).url
            : typeof profile?.image === 'string'
              ? profile.image
              : null;

    return (
        <AppSidebar
            variant='inset'
            user={{
                name: profile?.name || admin?.name,
                email: admin?.email,
                image: profileImageUrl,
            }}
        />
    );
}

const DashboardWrapper = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className=''>
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': 'calc(var(--spacing) * 72)',
                        '--header-height': 'calc(var(--spacing) * 12)',
                    } as any
                }>
                <Suspense fallback={null}>
                    <SidebarWrapper />
                </Suspense>
                <SidebarInset>
                    <Suspense
                        fallback={
                            <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
                                <div className='flex w-full items-center gap-1 px-4 md:gap-2 md:px-6'>
                                    <SidebarTrigger className='-ml-1' />
                                    <Separator
                                        orientation='vertical'
                                        className='mx-2 data-[orientation=vertical]:h-4'
                                    />
                                    <h1 className='text-base font-normal'>
                                        Welcome !
                                    </h1>
                                </div>
                            </header>
                        }>
                        <SiteHeader />
                    </Suspense>
                    <div className='flex flex-1 flex-col w-full'>
                        <div className='@container/main flex flex-1 flex-col gap-2 w-full'>
                            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6 w-full max-w-full'>
                                <Suspense fallback={null}>
                                    <DashboardFadeIn>{children}</DashboardFadeIn>
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
};

export default DashboardWrapper;

