/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth';
import {
    deleteSingleImageFromCloudinary,
    uploadImageToCloudinary,
} from '@/lib/image-service';
import { getSessionPermissions, requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { headers } from 'next/headers';

// ─── Public / CMS helpers ─────────────────────────────────────────────────────

/** Social links for the site's primary author (SUPER_ADMIN), used on public pages. */
export async function getPublicAuthorSocialLinks() {
    'use cache';
    cacheLife('minutes');
    cacheTag('public-author-social-links');
    try {
        const owner = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' },
            select: { id: true },
        });
        if (!owner) return [];
        return await prisma.socialLink.findMany({ where: { userId: owner.id } });
    } catch {
        return [];
    }
}

// ─── CMS site profile (singleton, used for public-facing pages) ───────────────

export async function getProfile() {
    'use cache';
    cacheLife('minutes');
    cacheTag('profile');
    try {
        const profile = await prisma.profile.findFirst();
        return profile as any;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function getSocialLinks(userId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`socialLinks-${userId}`);
    try {
        return await prisma.socialLink.findMany({ where: { userId } });
    } catch (error) {
        console.error('Error fetching social links:', error);
        return [];
    }
}

/**
 * Edits the site's author profile, the Profile row shown on press releases.
 *
 * Finding F5 (checklist 4a.39): the id is required and must name an existing row.
 * The old upsert with a 'default-profile-id' fallback let an omitted id write to a
 * shared magic row and an invented id create a new one. This is an update, and a
 * missing row is an error.
 */
export async function updateUserInformationById(
    id: string,
    data: {
        name?: string;
        bio?: string;
        about?: string;
        image?: { url: string; public_id: string } | string | null;
    }
) {
    const authorised = await requirePermission(Permission.MANAGE_SITE_SETTINGS);
    if (!authorised) return UNAUTHORIZED;

    if (typeof id !== 'string' || id.trim() === '') {
        return { success: false, error: 'A profile id is required' };
    }

    try {
        const updatePayload: Record<string, any> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.bio !== undefined) updatePayload.bio = data.bio;
        if (data.about !== undefined) updatePayload.about = data.about;
        if (data.image !== undefined) updatePayload.image = data.image;

        const profile = await prisma.profile.update({
            where: { id },
            data: updatePayload,
        });

        updateTag('profile');
        return { success: true, data: profile };
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return { success: false, error: 'Profile not found' };
        }
        console.error('Error updating profile information:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function updateSocialLinks(
    links: { name: string; url: string }[]
) {
    const authorised = await requirePermission(Permission.MANAGE_SOCIAL_LINKS);
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    try {
        await prisma.socialLink.deleteMany({ where: { userId: session.id } });
        if (links.length > 0) {
            await prisma.socialLink.createMany({
                data: links.map(l => ({ ...l, userId: session.id })),
            });
        }
        updateTag(`socialLinks-${session.id}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating social links:', error);
        return { success: false, error: 'Failed to update social links' };
    }
}

// ─── Per-user profile (each user manages their own account) ──────────────────
//
// Self-scoped: these need a session and act only on the caller's own row. No
// permission applies, because a signed-in user may always edit their own account.

/**
 * Updates the current user's name and bio via Better Auth.
 * Also refreshes the session cookie so the sidebar reflects the change.
 */
export async function updateCurrentUserProfile(data: {
    name?: string;
    bio?: string;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return UNAUTHORIZED;

    if (!data.name && data.bio === undefined) {
        return { success: false, error: 'No fields to update' };
    }

    try {
        await auth.api.updateUser({
            body: { ...data } as any,
            headers: await headers(),
        });
        return { success: true };
    } catch (err: any) {
        console.error('updateCurrentUserProfile error:', err);
        const message = err?.body?.message ?? err?.message ?? 'Failed to update profile';
        return { success: false, error: message };
    }
}

/**
 * Stores the new profile photo URL in the Better Auth user (updates session cookie)
 * and persists the Cloudinary publicId for future deletion.
 */
export async function updateCurrentUserPhoto(data: {
    url: string;
    publicId: string;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    try {
        // Update image URL via Better Auth: this also refreshes the session cookie
        await auth.api.updateUser({
            body: { image: data.url },
            headers: await headers(),
        });

        // imagePublicId is an internal field, updated directly via Prisma
        await prisma.user.update({
            where: { id: session.id },
            data: { imagePublicId: data.publicId },
        });

        return { success: true };
    } catch (err: any) {
        console.error('updateCurrentUserPhoto error:', err);
        return { success: false, error: err?.body?.message ?? 'Failed to update photo' };
    }
}

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

export async function uploadProfilePhoto(formData: FormData) {
    const authorised = await getSessionPermissions();
    if (!authorised) return UNAUTHORIZED;

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    try {
        const result = await uploadImageToCloudinary(file, {
            folder: 'profile-photos',
        });
        return { success: true, url: result.url, publicId: result.id };
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return { success: false, error: 'Upload failed' };
    }
}

/**
 * Removes the caller's OWN current photo and nothing else: the id must match the one
 * stored on their row. Before this, any signed-in user could delete any Cloudinary asset
 * by id through here (finding F1's residual), which is DELETE_MEDIA's job, not a
 * profile's.
 */
export async function removeProfilePhoto(publicId: string) {
    const authorised = await getSessionPermissions();
    if (!authorised) return UNAUTHORIZED;
    const { session } = authorised;

    const me = await prisma.user.findUnique({
        where: { id: session.id },
        select: { imagePublicId: true },
    });
    if (!publicId || !me?.imagePublicId || me.imagePublicId !== publicId) {
        return { success: false, error: 'That is not your current profile photo' };
    }

    try {
        await deleteSingleImageFromCloudinary(publicId);
        return { success: true };
    } catch (error) {
        console.error('Error removing profile photo:', error);
        return { success: false, error: 'Removal failed' };
    }
}
