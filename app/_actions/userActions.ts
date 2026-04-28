/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import {
    deleteSingleImageFromCloudinary,
    uploadImageToCloudinary,
} from '@/lib/image-service';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { getAdminSession } from './auth-actions';

/**
 * Retrieves the global profile information.
 */
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

/**
 * Retrieves the global social links.
 */
export async function getSocialLinks() {
    'use cache';
    cacheLife('minutes');
    cacheTag('socialLinks');
    try {
        const socialLinks = await prisma.socialLink.findMany();
        return socialLinks || [];
    } catch (error) {
        console.error('Error fetching social links:', error);
        return [];
    }
}

/**
 * Updates profile information by ID.
 * Only accepts known fields to prevent Prisma type errors.
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
    const session = await getAdminSession();
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Build a clean update payload with only the fields that were provided.
        const updatePayload: Record<string, any> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.bio !== undefined) updatePayload.bio = data.bio;
        if (data.about !== undefined) updatePayload.about = data.about;
        if (data.image !== undefined) {
            // Store the image as a JSON object if it has url/public_id,
            // or as a plain string URL, or clear it with null.
            updatePayload.image = data.image;
        }

        const profile = await prisma.profile.upsert({
            where: { id: id || 'default-profile-id' },
            update: updatePayload,
            create: {
                id: id || 'default-profile-id',
                name: data.name ?? '',
                bio: data.bio ?? '',
                about: data.about ?? '',
                // 'as any' bypasses stale Prisma generated type — image is Json? in schema.
                // Run `prisma generate` if this type error re-appears after a client reset.
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

/**
 * Updates social links.
 */
export async function updateSocialLinks(
    links: { name: string; url: string }[]
) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await prisma.socialLink.deleteMany({});
        await prisma.socialLink.createMany({
            data: links,
        });
        updateTag('socialLinks');
        return { success: true };
    } catch (error) {
        console.error('Error updating social links:', error);
        return { success: false, error: 'Failed to update social links' };
    }
}

/**
 * Uploads a profile photo to Cloudinary.
 */
export async function uploadProfilePhoto(formData: FormData) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    try {
        const result = await uploadImageToCloudinary(file, {
            folder: 'profile-photos',
        });

        return {
            success: true,
            url: result.url,
            publicId: result.id,
        };
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return { success: false, error: 'Upload failed' };
    }
}

/**
 * Removes a profile photo from Cloudinary.
 */
export async function removeProfilePhoto(publicId: string) {
    const session = await getAdminSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await deleteSingleImageFromCloudinary(publicId);
        return { success: true };
    } catch (error) {
        console.error('Error removing profile photo:', error);
        return { success: false, error: 'Removal failed' };
    }
}

