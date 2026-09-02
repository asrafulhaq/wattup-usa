import cloudinary from '@/lib/cloudinary';
import {
    UploadApiErrorResponse,
    UploadApiOptions,
    UploadApiResponse,
} from 'cloudinary';

interface UploadOptions {
    folder?: string;
    tags?: string[];
    userId?: string;
    publicId?: string;
}

export interface CloudinaryImageResponse {
    id: string;
    url: string;
    thumbnail: string;
    originalName: string;
    size: number;
    format: string;
    width: number;
    height: number;
    created_at: string;
}

/**
 * The only Cloudinary folders an upload may land in, or an image be moved to. Each one is a
 * folder a caller in this app already uses: 'tiptap' from lib/tiptap-utils.ts, 'articles'
 * from the article form, 'locations' from the location form, 'profile-photos' from
 * userActions.ts, and 'drafts', the default below. It lives here rather than in a
 * 'use server' module, which cannot export a constant, so the REST route and the server
 * actions enforce one list instead of two that drift.
 */
export const ALLOWED_UPLOAD_FOLDERS: ReadonlySet<string> = new Set([
    'tiptap',
    'articles',
    'locations',
    'profile-photos',
    'drafts',
]);

export function isAllowedFolder(value: unknown): value is string {
    return typeof value === 'string' && ALLOWED_UPLOAD_FOLDERS.has(value);
}

/**
 * Largest upload accepted, in bytes. The REST route refuses a larger Content-Length
 * before it reads the body; the upload actions refuse a larger file after. Lives here
 * for the same reason as the folder list: a 'use server' module cannot export a constant.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function getOptimizedUrl(url: string): string {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

export async function uploadImageToCloudinary(
    file: File,
    options: UploadOptions = {}
): Promise<CloudinaryImageResponse> {
    const {
        folder = 'drafts',
        tags = [],
        userId = 'anonymous',
        publicId,
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const uploadOptions: UploadApiOptions = {
            folder: folder,
            resource_type: 'auto' as const,
            tags: tags,
            context: { userId: userId },
            transformation: [{ fetch_format: 'auto', quality: 'auto' }],
            ...(publicId && { public_id: publicId, overwrite: true }),
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
            ) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                } else {
                    resolve({
                        id: result.public_id,
                        url: getOptimizedUrl(result.secure_url),
                        thumbnail: getOptimizedUrl(result.secure_url),
                        originalName: file.name,
                        size: result.bytes,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                        created_at: result.created_at,
                    });
                }
            }
        );

        uploadStream.end(buffer);
    });
}

export async function deleteImagesFromCloudinary(publicIds: string[]) {
    return await cloudinary.api.delete_resources(publicIds);
}

export async function deleteSingleImageFromCloudinary(publicId: string) {
    return await cloudinary.uploader.destroy(publicId);
}

export async function moveImageInCloudinary(
    publicId: string,
    newFolder: string
) {
    const parts = publicId.split('/');
    const filename = parts.pop();
    const newPublicId = `${newFolder}/${filename}`;
    return await cloudinary.uploader.rename(publicId, newPublicId);
}

export async function cleanupOldDraftsInCloudinary(hours = 24) {
    const cutoffTime = new Date(
        Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const searchResult = await cloudinary.search
        .expression(`folder:drafts AND created_at<${cutoffTime}`)
        .max_results(100)
        .execute();

    const resources = searchResult.resources;
    const publicIds = resources.map(
        (res: { public_id: string }) => res.public_id
    );

    if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
    }

    return publicIds.length;
}

