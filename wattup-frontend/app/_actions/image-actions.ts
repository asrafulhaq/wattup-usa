/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from "next/cache";
import {
    deleteImagesFromCloudinary,
    deleteSingleImageFromCloudinary,
    moveImageInCloudinary,
    uploadImageToCloudinary
} from '@/lib/image-service';

// upload single image
export async function uploadSingleImage(file: File, options = {}) {
    try {
        const result = await uploadImageToCloudinary(file, options);
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
export async function uploadMultipleImage(files: File[], options = {}) {
    try {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        const uploadPromises = files.map(file =>
            uploadImageToCloudinary(file, options)
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
export async function deleteImages(publicIds: string[]) {
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
    console.log(`Cleanup requested for drafts older than ${hours} hours. (Skipped to avoid fetch during build)`);
    return { success: true };
}
