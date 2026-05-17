import { getSiteSettings } from '@/app/_actions/settingsActions';
import { SettingsForm } from '@/components/dashboard/settings/settings-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Settings | WattUp Dashboard',
    description: 'Manage tracking codes, AEO schema, and custom scripts.',
};

export default async function SettingsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/admin');

    const settings = await getSiteSettings();

    return (
        <div className='px-4 md:px-6 lg:px-8'>
            <SettingsForm settings={settings} />
        </div>
    );
}

