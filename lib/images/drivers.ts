import { cloudinaryUrl } from './home';

export const driversImages = {
    driverWhyChoose1: 'driver-why-choose-1_pizwmm',
    driverWhyChoose2: 'driver-why-choose-2_r36onl',
    driverWhyChoose3: 'driver-why-choose-3_mhtzfa',
    driverWhyChoose4: 'driver-why-choose-4_bhs3w9',
    driverWhyChooseMobile1: 'driver-why-choose-4_bhs3w9',
    driverWhyChooseMobile4: 'driver-why-choose-mobile-4_wyfpgg',
    faqImage: 'faq-image_srfinr',
    forDriverPageHeroMobile: 'for-driver-page-hero-mobile_rev1cw',
    forDriverPageHero: 'for-driver-page-hero_goh5np',
    map: 'map_dtyac1',
    ogImage: 'og-image_xxtfwu',
};

export const driversImageUrls = Object.fromEntries(
    Object.entries(driversImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof driversImages, string>;






