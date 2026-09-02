/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from "next/cache";
import {
    deleteImagesFromCloudinary,
    deleteSingleImageFromCloudinary,
    isAllowedFolder,
    moveImageInCloudinary,
    uploadImageToCloudinary
} from '@/lib/image-service';
import { getSession } from './auth-actions';

// Every export below checks the session for itself. A 'use server' export is its own HTTP
// endpoint, so a caller having checked proves nothing. Any signed-in user passes for now;
// the UPLOAD_MEDIA permission tightens this in phase 4a.
//
// The upload actions hand Cloudinary a fresh object carrying only a validated folder, never
// the caller's options as received. A caller-supplied publicId would overwrite a live asset
// in place at its existing URL: the public site defaced with no database write and nothing
// visible in the dashboard.

// upload single image
export async function uploadSingleImage(file: File, options: { folder?: string } = {}) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const folder = options?.folder;
    if (!isAllowedFolder(folder)) return { success: false, error: 'Invalid folder' };

    try {
        const result = await uploadImageToCloudinary(file, { folder });
        revalidatePath("/")
        return {
            data: result,
            success: true
        };
    } catch (error: any) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Upload failed');
    }
}

// upload multiple image
export async function uploadMultipleImage(files: File[], options: { folder?: string } = {}) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const folder = options?.folder;
    if (!isAllowedFolder(folder)) return { success: false, error: 'Invalid folder' };

    try {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const uploadPromises = files.map(file =>
            uploadImageToCloudinary(file, { folder })
        );

        const uploadedImages = await Promise.all(uploadPromises);

        revalidatePath("/")
        return {
            data: uploadedImages,
            uploadedMediaData: uploadedImages,
            success: true
        };
    } catch (error: any) {
        console.error('Multiple upload error:', error);
        throw new Error(error.message || 'Upload failed');
    }
}

//delete multiple images
// Any id is accepted for now: scoping deletes to media the caller owns needs an ownership model, phase 4a.
export async function deleteImages(publicIds: string[]) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        const result = await deleteImagesFromCloudinary(publicIds);
        revalidatePath("/")
        return {
            success: true,
            result
        };
    } catch (error: any) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Delete failed');
    }
}

//delete Single image
export async function deleteSingleImage(publicId: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        const result = await deleteSingleImageFromCloudinary(publicId);
        revalidatePath("/")
        return {
            success: true,
            result
        };
    } catch (error: any) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Delete failed');
    }
}

// move image to another folder
export async function moveImage(publicId: string, newFolder: string, userId?: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    if (!isAllowedFolder(newFolder)) return { success: false, error: 'Invalid folder' };

    try {
        const result = await moveImageInCloudinary(publicId, newFolder);
        revalidatePath("/")
        return {
            success: true,
            data: {
                id: result.public_id,
                url: result.secure_url,
            }
        };
    } catch (error: any) {
        console.error('Move error:', error);
        throw new Error(error.message || 'Move failed');
    }
}

// clean up old drafts
export async function cleanupOldDrafts(hours = 24) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    // Clamped to between an hour and thirty days, so a caller cannot widen the delete
    // window to cover everything ever left in drafts.
    const safeHours = Math.min(720, Math.max(1, Number.isFinite(hours) ? hours : 24));
    console.log(`Cleanup requested for drafts older than ${safeHours} hours. (Skipped to avoid fetch during build)`);
    return { success: true };
}
