import { LocationsClient } from '@/components/dashboard/locations/locations-client';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { LocationsBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getDashboardLocations } from '@/lib/locations/dashboard';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

async function LocationsTable() {
    const [locations, authorised] = await Promise.all([
        getDashboardLocations(),
        getSessionPermissions(),
    ]);

    // The read returns an empty list to a caller without the permission, so this is
    // about saying why rather than showing an empty table that looks like a bug.
    // VIEW_LOCATIONS opens the list; the controls inside it are gated one by one.
    if (!hasPermission(authorised?.permissions, Permission.VIEW_LOCATIONS)) {
        return <NoAccess what='charging locations' role={authorised?.session.role} />;
    }

    return (
        <LocationsClient
            locations={locations}
            canManage={hasPermission(authorised?.permissions, Permission.MANAGE_LOCATIONS)}
            canDelete={hasPermission(authorised?.permissions, Permission.DELETE_LOCATIONS)}
        />
    );
}

export default function LocationsPage() {
    return (
        <PageShell>
            <PageHeader
                title='Charging locations'
                description='Every signed site, what a driver sees, and whether it appears on the public map.'
            />
            <Suspense fallback={<LocationsBodySkeleton />}>
                <LocationsTable />
            </Suspense>
        </PageShell>
    );
}
