import { cloudinaryUrl } from './home';

export const locationsImages = {
    locationPageHeroBgMobile: 'location-page-hero-bg-mobile_ncrkwj',
    locationPageHeroBg: 'location-page-hero-bg_yn9o4c',
};

export const locationsImageUrls = Object.fromEntries(
    Object.entries(locationsImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof locationsImages, string>;




