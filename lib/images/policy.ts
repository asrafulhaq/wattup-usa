import { cloudinaryUrl } from './home';

export const policyImages = {
    ogImage: 'og-image_lftfqi',
    policy1: 'policy-1_ej1afs',
    policy2: 'policy-2_bev815',
    policy3: 'policy-3_wzhipa',
    policyPageHero: 'policy-page-hero_bjlndn',
    policyPageHeroMobile: 'policy-page-hero-mobile_jhpaaw',
};

export const policyImageUrls = Object.fromEntries(
    Object.entries(policyImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof policyImages, string>;














