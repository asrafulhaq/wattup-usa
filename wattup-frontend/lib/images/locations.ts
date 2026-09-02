import { cloudinaryUrl } from './home';

export const locationsImages = {
    locationPageHeroBgMobile: 'location-page-hero-bg-mobile_unloib',
    locationPageHeroBg: 'location-page-hero-bg_qv39cc',
};

export const locationsImageUrls = Object.fromEntries(
    Object.entries(locationsImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof locationsImages, string>;






