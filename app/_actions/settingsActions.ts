'use server';

import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { getAdminSession } from './auth-actions';

const SETTINGS_ID = 'singleton';

export type SiteSettingsData = {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    googleSiteVerification?: string;
    metaPixelId?: string;
    headScripts?: string;
    bodyStartScripts?: string;
    bodyEndScripts?: string;
    orgName?: string;
    orgDescription?: string;
    orgUrl?: string;
    orgPhone?: string;
    orgEmail?: string;
    orgAddress?: string;
    orgLogoUrl?: string;
    orgTwitter?: string;
    orgLinkedin?: string;
    orgFacebook?: string;
    orgInstagram?: string;
};

export async function getSiteSettings() {
    'use cache';
    cacheLife('hours');
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
