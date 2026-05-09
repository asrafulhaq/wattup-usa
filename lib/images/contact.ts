import { cloudinaryUrl } from './home';

export const contactImages = {
    contactPageCtaImage: 'contact-page-cta-image_r65l4m',
    contactPageHero: 'contact-page-hero_nnihsh',
    contactPageHeroMobile: 'contact-page-hero-mobile_ynplzg',
    ogImage: 'og-image_b3uuvs',
};

export const contactImageUrls = Object.fromEntries(
    Object.entries(contactImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof contactImages, string>;
















