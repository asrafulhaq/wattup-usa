import { cloudinaryUrl } from './home';

export const notFoundImages = {
    heroImage: 'hero-image_trmha8',
    heroImageMobile: 'hero-image-mobile_fskp8a',
    ogImage: 'og-image_ybtthm',
};

export const notFoundImageUrls = Object.fromEntries(
    Object.entries(notFoundImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof notFoundImages, string>;






