export const videos = {
    video1: 'wattup_v4_k0s3wd',
};

export function cloudinaryVideoUrl(publicId: string) {
    const CLOUD_NAME =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsfms7jb4';

    // vc_auto: Automatically picks the best video codec
    // f_auto: Automatically picks the best container (WebM, MP4, etc.)
    // q_auto: Compresses the video bit-rate intelligently
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto,vc_auto/${publicId}`;
}
export const videoUrls = Object.fromEntries(
    Object.entries(videos).map(([key, id]) => [key, cloudinaryVideoUrl(id)])
) as Record<keyof typeof videos, string>;


