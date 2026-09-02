import { cloudinaryUrl } from './home';

export const policyImages = {
    ogImage: 'og-image_wcw3xd',
    policy1: 'policy-1_ej1afs',
    policy2: 'policy-2_a78hgs',
    policy3: 'policy-3_ndqrjd',
    policyPageHero: 'policy-page-hero_klbi8m',
    policyPageHeroMobile: 'policy-page-hero-mobile_fz80x6',
};

export const policyImageUrls = Object.fromEntries(
    Object.entries(policyImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof policyImages, string>;



















