import { cloudinaryUrl } from './home';

export const driversImages = {
    driverWhyChoose1: 'driver-why-choose-1_m9svmd',
    driverWhyChoose2: 'driver-why-choose-2_mtmoyx',
    driverWhyChoose3: 'driver-why-choose-3_cjig94',
    driverWhyChoose4: 'driver-why-choose-4_sw6rsy',
    driverWhyChooseMobile1: 'driver-why-choose-1_m9svmd',
    driverWhyChooseMobile4: 'driver-why-choose-4_sw6rsy',
    faqImage: 'faq-image_aicdgz',
    // F18: for-driver-page-hero-mobile_rev1cw is gone from the account. It is the mobile
    // fallback in components/drivers/page-hero.tsx, unreachable on the live /for-drivers
    // route today (that page always passes an explicit mobileImage), but the app's own
    // /for-drivers page renders hero_image_layered_mobile_np7nxt in that exact slot, in the
    // same drivers folder from the same 2026-05-09 upload batch, so it is the right asset.
    forDriverPageHeroMobile: 'hero_image_layered_mobile_np7nxt',
    // F18: hero-image_x2y7j3 (the drivers hero fallback) is gone from the account. The live
    // /for-drivers route already renders hero-image_ajsueo in this exact spot via
    // hero_image_layered, in the same folder and upload batch, so it is the intended asset.
    forDriverPageHero: 'hero-image_ajsueo',
    map: 'map_dtyac1',
    og_image_layered: 'og-image_x0lxsb',
    hero_image_layered: 'hero-image_ajsueo',
    hero_image_mobile: 'hero_image_layered_mobile_np7nxt',
};

export const driversImageUrls = Object.fromEntries(
    Object.entries(driversImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof driversImages, string>;










