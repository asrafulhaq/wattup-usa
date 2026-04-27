import { cloudinaryUrl } from './home';

export const contactImages = {
    contactPageCtaImage: 'contact-page-cta-image_meut2h',
    contactPageHero: 'contact-page-hero_tzilhw',
    contactPageHeroMobile: 'contact-page-hero-mobile_oze63f',
    ogImage: 'og-image_ozdoz8',
};

export const contactImageUrls = Object.fromEntries(
    Object.entries(contactImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof contactImages, string>;







