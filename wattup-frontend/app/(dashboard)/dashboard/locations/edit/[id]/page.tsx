import { getSession } from '@/app/_actions/auth-actions';
import { LocationForm } from '@/components/dashboard/locations/location-form';
import { NoAccess } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { getDashboardAmenities, getLocationForEdit } from '@/lib/locations/dashboard';
import { hasRoleDefault, Permission } from '@/lib/permissions';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditLocationPage({ params }: Props) {
    const session = await getSession();
    if (!hasRoleDefault(session?.role, Permission.MANAGE_LOCATIONS)) {
        return <NoAccess what='charging locations' role={session?.role} />;
    }

    const { id } = await params;
    const [location, amenities] = await Promise.all([
        getLocationForEdit(id),
        getDashboardAmenities(),
    ]);
    if (!location) notFound();

    return (
        <PageShell>
            <PageHeader
                title={location.name}
                description={`${location.street}, ${location.city}, ${location.region} ${location.postalCode}`}
                actions={
                    location.published ? (
                        <Link
                            href={`/locations/${location.slug}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex h-10 items-center gap-2 rounded-[10px] border border-dash-border bg-dash-surface px-4 text-[14px] font-medium text-dash-body transition-colors hover:bg-dash-canvas hover:text-dash-heading'>
                            View on the site
                            <ArrowUpRight className='size-4' />
                        </Link>
                    ) : (
                        <span className='flex h-10 items-center rounded-[10px] border border-dash-border bg-dash-canvas px-4 text-[13px] text-dash-muted'>
                            Hidden from the public site
                        </span>
                    )
                }
            />
            <LocationForm location={location} amenities={amenities} />
        </PageShell>
    );
}
