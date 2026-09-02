/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/app/_actions/auth-actions';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardFadeIn } from '@/components/dashboard/dashboard-fade-in';
import { RequireSession } from '@/components/dashboard/require-session';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { hasPermission, Permission } from '@/lib/permissions';
import React, { Suspense } from 'react';

async function SidebarWrapper() {
    const session = await getSession();

    // Nothing rather than a signed-in looking shell. Without this a rejected session
    // still drew the logo, an empty nav and a user card reading "Admin" with no email,
    // which is the part that made the screen look broken rather than signed out.
    if (!session) return null;

    return (
        <AppSidebar
            variant='inset'
            showUsers={hasPermission(session.role, Permission.VIEW_USERS)}
            showSettings={hasPermission(session.role, Permission.MANAGE_SITE_SETTINGS)}
            showLocations={hasPermission(session.role, Permission.MANAGE_LOCATIONS)}
            user={{
                name: session.name,
                email: session.email,
                image: session.image,
            }}
        />
    );
}

async function HeaderWrapper() {
    const session = await getSession();
    return <SiteHeader name={session?.name} />;
}

const DashboardWrapper = async ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 68)',
                    '--header-height': 'calc(var(--spacing) * 14)',
                } as any
            }>
            <Suspense fallback={null}>
                <SidebarWrapper />
            </Suspense>

            {/* The canvas sits a shade below the cards, which is what lets a plain white
                panel read as raised without a shadow heavy enough to notice. */}
            {/* dash-scope carries the dashboard's field styling. See globals.css: the
                base Input is the public site's tall filled control, which is wrong at
                this density. */}
            <SidebarInset className='dash-scope bg-dash-canvas'>
                <Suspense
                    fallback={
                        <div className='h-(--header-height) shrink-0 border-b border-dash-border bg-dash-surface' />
                    }>
                    <HeaderWrapper />
                </Suspense>

                <div className='@container/main flex flex-1 flex-col'>
                    <Suspense fallback={null}>
                        <RequireSession>
                            <DashboardFadeIn>{children}</DashboardFadeIn>
                        </RequireSession>
                    </Suspense>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DashboardWrapper;
