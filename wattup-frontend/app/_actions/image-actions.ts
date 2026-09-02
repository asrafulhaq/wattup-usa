/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import {
    deleteImagesFromCloudinary,
    deleteSingleImageFromCloudinary,
    isAllowedFolder,
    MAX_UPLOAD_BYTES,
    moveImageInCloudinary,
    uploadImageToCloudinary
} from '@/lib/image-service';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';
import { Permission } from '@/lib/permissions';

// Every export below gates itself on a permission resolved for this request (checklist
// 4a.16): UPLOAD_MEDIA to put something into Cloudinary or move it, DELETE_MEDIA to
// take something out. A 'use server' export is its own HTTP endpoint, so a caller
// having checked proves nothing.
//
// The upload actions hand Cloudinary a fresh object carrying only a validated folder, never
// the caller's options as received. A caller-supplied publicId would overwrite a live asset
// in place at its existing URL: the public site defaced with no database write and nothing
// visible in the dashboard.
//
// Nothing here revalidates a page (backlog B.9). An upload changes no page until the
// article, location or profile that embeds it is saved, and each of those saves
// invalidates its own tag; a deleted asset that a published page still references
// would be a broken image whether or not the page were re-rendered.
//
// MAX_UPLOAD_BYTES lives in lib/image-service.ts: a 'use server' module cannot export
// a constant, and the REST route enforces the same figure before it reads the body.

// upload single image
export async function uploadSingleImage(file: File, options: { folder?: string } = {}) {
    const authorised = await requirePermission(Permission.UPLOAD_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    const folder = options?.folder;
    if (!isAllowedFolder(folder)) return { success: false, error: 'Invalid folder' };
    if (file.size > MAX_UPLOAD_BYTES) return { success: false, error: 'File is larger than 10 MB' };

    try {
        const result = await uploadImageToCloudinary(file, { folder });
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
    const authorised = await requirePermission(Permission.UPLOAD_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    const folder = options?.folder;
    if (!isAllowedFolder(folder)) return { success: false, error: 'Invalid folder' };

    try {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }
        if (files.some(file => file.size > MAX_UPLOAD_BYTES)) {
            return { success: false, error: 'A file is larger than 10 MB' };
        }

        const uploadPromises = files.map(file =>
            uploadImageToCloudinary(file, { folder })
        );

        const uploadedImages = await Promise.all(uploadPromises);

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
// Any id is accepted: scoping deletes to media the caller owns needs an ownership model
// that does not exist yet. DELETE_MEDIA is the gate.
export async function deleteImages(publicIds: string[]) {
    const authorised = await requirePermission(Permission.DELETE_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    try {
        const result = await deleteImagesFromCloudinary(publicIds);
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
    const authorised = await requirePermission(Permission.DELETE_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    try {
        const result = await deleteSingleImageFromCloudinary(publicId);
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
    const authorised = await requirePermission(Permission.UPLOAD_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    if (!isAllowedFolder(newFolder)) return { success: false, error: 'Invalid folder' };

    try {
        const result = await moveImageInCloudinary(publicId, newFolder);
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
    const authorised = await requirePermission(Permission.DELETE_MEDIA);
    if (!authorised) return UNAUTHORIZED;

    // Clamped to between an hour and thirty days, so a caller cannot widen the delete
    // window to cover everything ever left in drafts.
    const safeHours = Math.min(720, Math.max(1, Number.isFinite(hours) ? hours : 24));
    console.log(`Cleanup requested for drafts older than ${safeHours} hours. (Skipped to avoid fetch during build)`);
    return { success: true };
}
