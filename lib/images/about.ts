import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_vhbvxb',
    aboutPageHeroImage: 'about-page-hero-image_f9zvbc',
    corePrincipals: 'core-principals_ghtsrs',
    ogImage: 'og-image_dcy0ou',
    partnerImage: 'partner-image_frpitt',
    mission: 'mission_mzy6nm',
    vision: 'vision_nwjxxw',
    future: 'future_l6nkt7',
    sustainability: 'sustainability_kq0ch0',
};

export const aboutImageUrls = Object.fromEntries(
    Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof aboutImages, string>;










