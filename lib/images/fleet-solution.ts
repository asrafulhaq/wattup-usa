import { cloudinaryUrl } from './home';

/**
 * Public IDs for Fleet Solutions page images.
 * TODO: Replace placeholder IDs with real Cloudinary public IDs once uploaded.
 */
export const fleetSolutionImages = {
    // Hero
    heroImage: 'hero-image_mpawrl',
    heroImageMobile: 'hero-image-mobile_mnqaah',

    commercial: 'commercial_mxzfno',
    commercialMobile: 'commercial-mobile_fm3tig',

    // OG / Social
    ogImage: 'og-image_jervr4',

    // CTA section
    ctaImage: 'cta-image_njhtnt',
    ctaImageMobile: 'cta-image-mobile_s6ml87',

    // Process steps
    process1: 'process-1_nbqd3x',
    process2: 'process-2_n92qlv',
    process3: 'process-3_np16df',
    process4: 'process-4_l8o6cq',
    process1Mobile: 'process-1_nbqd3x',
    process2Mobile: 'process-2_n92qlv',
    process3Mobile: 'process-3_np16df',
    process4Mobile: 'process-4_l8o6cq',

    // Reliability section
    reliability1: 'reliability-1_fbkibv',
    reliability2: 'reliability-2_cruoat',
    reliability3: 'reliability-3_y5h6yv',

    // Solutions grid
    solution1: 'solution-1_cgnqy3',
    solution2: 'solution-2_cxhsdf',
    solution3: 'solution-3_svnse9',
    solution4: 'solution-4_qmtkvr',

    // Why Choose section
    why1: 'why-1_cpffqy',
    why2: 'why-2_x6ei5w',
    why3: 'why-3_e4twji',
    why4: 'why-4_vuwfec',
    why5: 'why-5_rnicvo',
    why6: 'why-6_zoaal6',
    why7: 'why-7_jgvfs2',
    why8: 'why-8_mftoet',
    why5Mobile: 'why-5_rnicvo',
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























