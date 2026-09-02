'use server';

import { logActivity } from '@/lib/activity-log';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import { Permission, Role } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';

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

/**
 * Raw HTML injected into every public page (finding F4). Whoever writes these runs
 * JavaScript on every visitor, including whatever a visitor types into the contact
 * forms, so a CHANGE to any of them is SUPER_ADMIN only, on top of the permission the
 * rest of the form needs. The form submits every field on every save, so "change" is
 * measured against what is stored, not against whether the key is present.
 */
const SCRIPT_FIELDS = ['headScripts', 'bodyStartScripts', 'bodyEndScripts'] as const;

const SETTINGS_FIELDS = [
    'googleAnalyticsId',
    'googleTagManagerId',
    'googleSiteVerification',
    'metaPixelId',
    ...SCRIPT_FIELDS,
    'orgName',
    'orgDescription',
    'orgUrl',
    'orgPhone',
    'orgEmail',
    'orgAddress',
    'orgLogoUrl',
    'orgTwitter',
    'orgLinkedin',
    'orgFacebook',
    'orgInstagram',
] as const;

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
    const authorised = await requirePermission(Permission.MANAGE_SITE_SETTINGS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    try {
        const current = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });

        // Only the known columns, and only the ones the caller sent, so a stray key can
        // neither reach the database nor blank a field the form did not mean to touch.
        const changes: Partial<Record<(typeof SETTINGS_FIELDS)[number], string | null>> = {};
        const changed: string[] = [];
        for (const field of SETTINGS_FIELDS) {
            if (!(field in data)) continue;
            const next = data[field] ?? null;
            changes[field] = next;
            if ((current?.[field] ?? null) !== next) changed.push(field);
        }

        const scriptChanges = changed.filter(field =>
            (SCRIPT_FIELDS as readonly string[]).includes(field)
        );
        if (scriptChanges.length > 0 && session.role !== Role.SUPER_ADMIN) {
            return {
                success: false,
                error: 'Only a super admin can change the injected scripts.',
            };
        }

        const settings = await prisma.siteSettings.upsert({
            where: { id: SETTINGS_ID },
            update: changes,
            create: { id: SETTINGS_ID, ...changes },
        });

        if (changed.length > 0) {
            // Which fields, never their values: a script body does not belong in a log row.
            await logActivity({
                event: 'settings.updated',
                actor: { id: session.id, email: session.email },
                target: { id: session.id, email: session.email },
                meta: { fields: changed },
            });
        }

        updateTag('siteSettings');
        return { success: true, data: settings };
    } catch (error) {
        console.error('Error updating site settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}
