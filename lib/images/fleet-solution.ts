import { cloudinaryUrl } from './home';

/**
 * Public IDs for Fleet Solutions page images.
 * TODO: Replace placeholder IDs with real Cloudinary public IDs once uploaded.
 */
export const fleetSolutionImages = {
    // Hero
    heroImage: 'hero-image_mpawrl',
    heroImageMobile: 'hero-image-mobile_mnqaah',

    commercial: 'commercial_gq93hj',
    commercialMobile: 'commercial-mobile_nymmvr',

    // OG / Social
    ogImage: 'og-image_jervr4',

    // CTA section
    ctaImage: 'cta-image_njhtnt',
    ctaImageMobile: 'cta-image-mobile_s6ml87',

    // Process steps
    process1: 'process-1_a52dus',
    process2: 'process-2_n92qlv',
    process3: 'process-3_sretjh',
    process4: 'process-4_l8o6cq',
    process1Mobile: 'process-1-mobile_iiho0d',
    process2Mobile: 'process-2-mobile_yziyc0',
    process3Mobile: 'process-3-mobile_ea8qxy',
    process4Mobile: 'process-4-mobile_ztztxj',

    // Reliability section
    reliability1: 'reliability-1_fbkibv',
    reliability2: 'reliability-2_w7nsve',
    reliability3: 'reliability-3_yw1hmj',

    // Solutions grid
    solution1: 'solution-1_cgnqy3',
    solution2: 'solution-2_cxhsdf',
    solution3: 'solution-3_svnse9',
    solution4: 'solution-4_bbq92k',

    // Why Choose section
    why1: 'why-1_xlxo3w',
    why2: 'why-2_u4aozj',
    why3: 'why-3_e4twji',
    why4: 'why-4_jlhzdy',
    why5: 'why-5_fflfon',
    why6: 'why-6_zoaal6',
    why7: 'why-7_s2hjnm',
    why8: 'why-8_gvihoo',
    why5Mobile: 'why-5-mobile_v2tnro',
    why8Mobile: 'why-8-mobile_fbehvq',
};

/**
 * Full Cloudinary URLs — use these with `next/image`, OG metadata, etc.
 * Falls back gracefully once images are uploaded with matching public IDs.
 */
export const fleetSolutionImageUrls = Object.fromEntries(
    Object.entries(fleetSolutionImages).map(([key, id]) => [
        key,
        cloudinaryUrl(id),
    ])
) as Record<keyof typeof fleetSolutionImages, string>;








