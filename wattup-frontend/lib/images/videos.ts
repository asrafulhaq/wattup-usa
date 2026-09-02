export const videos = {
   video1: 'wattup_v4_k0s3wd', 
 videoMobile: 'wattup-vertical_v2_srbxzs',
};

export function cloudinaryVideoUrl(publicId: string, width?: number, startOffset?: number) {
    const CLOUD_NAME =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsfms7jb4';

    const transforms = ['f_auto', 'q_auto', 'vc_auto'];
    if (width) transforms.push(`w_${width},c_scale`);
    if (startOffset) transforms.push(`so_${startOffset}`);
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transforms.join(',')}/${publicId}`;
}
export const videoUrls = Object.fromEntries(
    Object.entries(videos).map(([key, id]) => [key, cloudinaryVideoUrl(id)])
) as Record<keyof typeof videos, string>;

