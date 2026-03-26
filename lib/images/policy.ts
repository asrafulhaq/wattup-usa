import { cloudinaryUrl } from './home';

export const policyImages = {
    ogImage: 'og-image_y4qcpx',
    policy1: 'policy-1_gnozcq',
    policy2: 'policy-2_nkqqym',
    policy3: 'policy-3_mkgr9a',
    policyPageHero: 'policy-page-hero_vhcsrw',
};

export const policyImageUrls = Object.fromEntries(
    Object.entries(policyImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof policyImages, string>;





