import { cloudinaryUrl } from './home';

export const notFoundImages = {
    heroImage: 'hero-image_nenaoc',
    ogImage: 'og-image_gtw2q5',
};

export const notFoundImageUrls = Object.fromEntries(
    Object.entries(notFoundImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof notFoundImages, string>;



