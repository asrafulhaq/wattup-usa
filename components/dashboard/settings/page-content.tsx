import { getSiteSettings } from '@/app/_actions/settingsActions';
import { cacheLife, cacheTag } from 'next/cache';
import { SettingsForm } from './settings-form';

const PageContent = async () => {
    'use cache';
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');

    const settings = await getSiteSettings();
    return <SettingsForm settings={settings} />;
};

export default PageContent;
