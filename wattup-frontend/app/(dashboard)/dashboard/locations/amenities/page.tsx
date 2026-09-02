import { AmenitiesClient } from '@/components/dashboard/locations/amenities-client';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { AmenitiesBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getDashboardAmenities } from '@/lib/locations/dashboard';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

async function AmenitiesTable() {
    const [amenities, authorised] = await Promise.all([
        getDashboardAmenities(),
        getSessionPermissions(),
    ]);

    if (!hasPermission(authorised?.permissions, Permission.VIEW_LOCATIONS)) {
        return <NoAccess what='charging locations' role={authorised?.session.role} />;
    }

    // Viewing the catalogue comes with VIEW_LOCATIONS, since reading a site means
    // reading its amenities. Changing the catalogue itself is the stricter permission.
    return (
        <AmenitiesClient
            amenities={amenities}
            canManage={hasPermission(authorised?.permissions, Permission.MANAGE_AMENITIES)}
        />
    );
}

export default function AmenitiesPage() {
    return (
        <PageShell>
            <PageHeader
                title='Amenities'
                description='The facilities a site can offer. Turning one off hides it everywhere and keeps every assignment.'
            />
            <Suspense fallback={<AmenitiesBodySkeleton />}>
                <AmenitiesTable />
            </Suspense>
        </PageShell>
    );
}
