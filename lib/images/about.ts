import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_ezjbxw',
    aboutPageHeroImage: 'about-page-hero-image_lf6wym',
    corePrincipals: 'core-principals_ghtsrs',
    ogImage: 'og-image_fqf3zy',
    partnerImage: 'partner-image_frpitt',
    mission: 'mission_maqyk6',
    vision: 'vision_nwjxxw',
    future: 'future_sgopfw',
    sustainability: 'sustainability_jz3ffp',
};

export const aboutImageUrls = Object.fromEntries(
    Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof aboutImages, string>;















