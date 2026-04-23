import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_hdaaso',
    aboutPageHeroImage: 'about-page-hero-image_wnsrqm',
    corePrincipals: 'core-principals_avimrw',
    ogImage: 'og-image_ltbuwq',
    partnerImage: 'partner-image_jz2tev',
    mission: 'mission_favbqd',
    vision: 'vision_ouyxay',
    future: 'future_rxesqw',
    sustainability: 'sustainability_ye4c0f',
};

export const aboutImageUrls = Object.fromEntries(
    Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof aboutImages, string>;

