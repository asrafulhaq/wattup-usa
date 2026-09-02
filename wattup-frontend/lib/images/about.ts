import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_wu7scr',
    aboutPageHeroImage: 'about-page-hero-image_g7uymg',
    corePrincipals: 'core-principals_ghtsrs',
    ogImage: 'og-image_jw0j90',
    partnerImage: 'partner-image_frpitt',
    mission: 'mission_cmmhbj',
    vision: 'vision_nwjxxw',
    future: 'future_gmxupy',
    sustainability: 'sustainability_guijzf',
};

export const aboutImageUrls = Object.fromEntries(
    Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof aboutImages, string>;





















