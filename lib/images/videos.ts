export const videos = {
    video1: 'video-1',
};

export function cloudinaryVideoUrl(publicId: string) {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsfms7jb4';
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}`;
}

export const videoUrls = Object.fromEntries(
    Object.entries(videos).map(([key, id]) => [key, cloudinaryVideoUrl(id)])
) as Record<keyof typeof videos, string>;
