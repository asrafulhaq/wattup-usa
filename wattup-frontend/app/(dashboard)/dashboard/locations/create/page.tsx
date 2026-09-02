import { LocationForm } from '@/components/dashboard/locations/location-form';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { getDashboardAmenities } from '@/lib/locations/dashboard';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';

export default async function CreateLocationPage() {
    const authorised = await getSessionPermissions();
    if (!hasPermission(authorised?.permissions, Permission.MANAGE_LOCATIONS)) {
        return <NoAccess what='charging locations' role={authorised?.session.role} />;
    }

    const amenities = await getDashboardAmenities();

    return (
        <PageShell>
            <PageHeader
                title='Add a charging location'
                description='Only the name, address, coordinates and status are needed to publish. The rest can follow.'
            />
            <LocationForm amenities={amenities} />
        </PageShell>
    );
}
