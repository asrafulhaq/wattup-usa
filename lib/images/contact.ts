import { cloudinaryUrl } from './home';

export const contactImages = {
    contactPageCtaImage: 'contact-page-cta-image_r65l4m',
    contactPageHero: 'contact-page-hero_mtsgpn',
    contactPageHeroMobile: 'contact-page-hero-mobile_q8ltor',
    ogImage: 'og-image_drtnn5',
};

export const contactImageUrls = Object.fromEntries(
    Object.entries(contactImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof contactImages, string>;












