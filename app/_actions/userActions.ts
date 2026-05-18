/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth';
import {
    deleteSingleImageFromCloudinary,
    uploadImageToCloudinary,
} from '@/lib/image-service';
import { hasPermission, Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { getAdminSession, getSession } from './auth-actions';

// ─── Public / CMS helpers ─────────────────────────────────────────────────────

/** Social links for the site's primary author (SUPER_ADMIN), used on public pages. */
export async function getPublicAuthorSocialLinks() {
    'use cache';
    cacheLife('minutes');
    cacheTag('public-author-social-links');
    try {
        const owner = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' as any },
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

export async function updateUserInformationById(
    id: string,
    data: {
        name?: string;
        bio?: string;
        about?: string;
        image?: { url: string; public_id: string } | string | null;
    }
) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        const updatePayload: Record<string, any> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.bio !== undefined) updatePayload.bio = data.bio;
        if (data.about !== undefined) updatePayload.about = data.about;
        if (data.image !== undefined) updatePayload.image = data.image;

        const profile = await prisma.profile.upsert({
            where: { id: id || 'default-profile-id' },
            update: updatePayload,
            create: {
                id: id || 'default-profile-id',
                name: data.name ?? '',
                bio: data.bio ?? '',
                about: data.about ?? '',
                image: data.image as any,
            },
        });

        updateTag('profile');
        return { success: true, data: profile };
    } catch (error) {
        console.error('Error updating profile information:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function updateSocialLinks(
    links: { name: string; url: string }[]
) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    if (!hasPermission(session.role, Permission.MANAGE_SOCIAL_LINKS)) {
        return { success: false, error: 'Insufficient permissions' };
    }

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

/**
 * Updates the current user's name and bio via Better Auth.
 * Also refreshes the session cookie so the sidebar reflects the change.
 */
export async function updateCurrentUserProfile(data: {
    name?: string;
    bio?: string;
}) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

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
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        // Update image URL via Better Auth — this also refreshes the session cookie
        await auth.api.updateUser({
            body: { image: data.url },
            headers: await headers(),
        });

        // imagePublicId is an internal field — update directly via Prisma
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
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

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

export async function removeProfilePhoto(publicId: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await deleteSingleImageFromCloudinary(publicId);
        return { success: true };
    } catch (error) {
        console.error('Error removing profile photo:', error);
        return { success: false, error: 'Removal failed' };
    }
}
