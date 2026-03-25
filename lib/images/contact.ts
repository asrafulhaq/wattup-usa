import { cloudinaryUrl } from './home';

export const contactImages = {
    contactPageCtaImage: 'contact-page-cta-image_umqx38',
    contactPageHero: 'contact-page-hero_gk1hio',
    ogImage: 'og-image_emayal',
};

export const contactImageUrls = Object.fromEntries(
    Object.entries(contactImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof contactImages, string>;



