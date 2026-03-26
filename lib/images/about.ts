import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_hdaaso',
    aboutPageHeroImage: 'about-page-hero-image_wnsrqm',
    corePrincipals: 'core-principals_avimrw',
    ogImage: 'og-image_ltbuwq',
    partnerImage: 'partner-image_jz2tev',
};

export const aboutImageUrls = Object.fromEntries(
    Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof aboutImages, string>;






