'use server';

import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { getAdminSession } from './auth-actions';

const SETTINGS_ID = 'singleton';

export type SiteSettingsData = {
    googleAnalyticsId?: string | null;
    googleTagManagerId?: string | null;
    googleSiteVerification?: string | null;
    metaPixelId?: string | null;
    headScripts?: string | null;
    bodyStartScripts?: string | null;
    bodyEndScripts?: string | null;
    orgName?: string | null;
    orgDescription?: string | null;
    orgUrl?: string | null;
    orgPhone?: string | null;
    orgEmail?: string | null;
    orgAddress?: string | null;
    orgLogoUrl?: string | null;
    orgTwitter?: string | null;
    orgLinkedin?: string | null;
    orgFacebook?: string | null;
    orgInstagram?: string | null;
};

export async function getSiteSettings() {
    'use cache';
    // stale: serve cached for 5 min, revalidate in bg every hour, hard expire after 1 day
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');
    try {
        const settings = await prisma.siteSettings.findUnique({
            where: { id: SETTINGS_ID },
        });
        return settings;
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return null;
    }
}

export async function updateSiteSettings(data: SiteSettingsData) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        const settings = await prisma.siteSettings.upsert({
            where: { id: SETTINGS_ID },
            update: data,
            create: { id: SETTINGS_ID, ...data },
        });
        updateTag('siteSettings');
        return { success: true, data: settings };
    } catch (error) {
        console.error('Error updating site settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}
