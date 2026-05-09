import { cloudinaryUrl } from './home';

export const driversImages = {
    driverWhyChoose1: 'driver-why-choose-1_m9svmd',
    driverWhyChoose2: 'driver-why-choose-2_mtmoyx',
    driverWhyChoose3: 'driver-why-choose-3_cjig94',
    driverWhyChoose4: 'driver-why-choose-4_sw6rsy',
    driverWhyChooseMobile1: 'driver-why-choose-1_m9svmd',
    driverWhyChooseMobile4: 'driver-why-choose-4_sw6rsy',
    faqImage: 'faq-image_aicdgz',
    forDriverPageHeroMobile: 'for-driver-page-hero-mobile_rev1cw',
    forDriverPageHero: 'hero-image_x2y7j3',
    map: 'map_dtyac1',
    og_image_layered: 'og-image_x0lxsb',
    hero_image_layered: 'hero-image_ajsueo',
    hero_image_mobile: 'hero_image_layered_mobile_np7nxt',
};

export const driversImageUrls = Object.fromEntries(
    Object.entries(driversImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof driversImages, string>;










