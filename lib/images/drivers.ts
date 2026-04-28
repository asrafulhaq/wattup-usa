import { cloudinaryUrl } from './home';

export const driversImages = {
    driverWhyChoose1: 'driver-why-choose-1_b9jcj2',
    driverWhyChoose2: 'driver-why-choose-2_f0nejm',
    driverWhyChoose3: 'driver-why-choose-3_jrxcpd',
    driverWhyChoose4: 'driver-why-choose-4_wu0pxz',
    driverWhyChooseMobile1: 'driver-why-choose-mobile-1_zihzak',
    driverWhyChooseMobile4: 'driver-why-choose-mobile-4_q8xcil',
    faqImage: 'faq-image_aicdgz',
    forDriverPageHeroMobile: 'for-driver-page-hero-mobile_rev1cw',
    forDriverPageHero: 'hero-image_x2y7j3',
    map: 'map_dtyac1',
    og_image_layered: 'og-image_w3cs7l',
    hero_image_layered: 'hero-image_csw7e6',
    hero_image_mobile: 'hero_image_layered_mobile_mldsgd',
};

export const driversImageUrls = Object.fromEntries(
    Object.entries(driversImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof driversImages, string>;

