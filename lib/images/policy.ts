import { cloudinaryUrl } from './home';

export const policyImages = {
    ogImage: 'og-image_y4qcpx',
    policy1: 'policy-1_ej1afs',
    policy2: 'policy-2_bev815',
    policy3: 'policy-3_dcgkfn',
    policyPageHero: 'policy-page-hero_n7cifx',
    policyPageHeroMobile: 'policy-page-hero-mobile_isyuhk',
};

export const policyImageUrls = Object.fromEntries(
    Object.entries(policyImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof policyImages, string>;










