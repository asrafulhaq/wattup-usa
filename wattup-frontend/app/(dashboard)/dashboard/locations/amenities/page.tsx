import { getSession } from '@/app/_actions/auth-actions';
import { AmenitiesClient } from '@/components/dashboard/locations/amenities-client';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { AmenitiesBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getDashboardAmenities } from '@/lib/locations/dashboard';
import { hasRoleDefault, Permission } from '@/lib/permissions';
import { Suspense } from 'react';

async function AmenitiesTable() {
    const [amenities, session] = await Promise.all([
        getDashboardAmenities(),
        getSession(),
    ]);

    if (!hasRoleDefault(session?.role, Permission.MANAGE_LOCATIONS)) {
        return <NoAccess what='charging locations' role={session?.role} />;
    }

    // Viewing the catalogue comes with MANAGE_LOCATIONS, since assigning amenities to a
    // site needs to show them. Changing the catalogue itself is the stricter permission.
    return (
        <AmenitiesClient
            amenities={amenities}
            canManage={hasRoleDefault(session?.role, Permission.MANAGE_AMENITIES)}
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
