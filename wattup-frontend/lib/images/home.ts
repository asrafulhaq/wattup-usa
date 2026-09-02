const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dsfms7jb4';

/** Build a full Cloudinary delivery URL from a public ID */
/** Build an optimized Cloudinary delivery URL */
export function cloudinaryUrl(publicId: string) {
    // f_auto: picks AVIF/WebP automatically
    // q_auto: compresses quality without losing detail
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;
}
/**
 * Public IDs .
 */
export const homeImages = {
    // Hero images
    hero1: 'hero-1_cufyrq',
    hero1Md: 'hero-1-md_kw0ekh',
    hero2: 'hero-2_bk5zds',
    hero2Md: 'hero-2-md_jq8set',
    homepageHero1: 'homepage-hero-1_dh8gwz',
    homepageHero3: 'homepage-hero-3_j6mbva',
    homepageHero4: 'homepage-hero-4_redtht',
    homepageHero5: 'homepage-hero-5_icjktz',

    slide_1_full: 'slide-1_yq5l8a',
    /* slide_1_layered: 'tex7-8_ik0ahw', */
    slide_1_layered: 'slide_1_layered_unuk3w',
    slide_1_layered_mobile: 'slide_1_mobile_pyp6mm',
    slide_1_full_mobile: 'slide_1_mobile_pyp6mm',

    slide_2_full: 'slide-2_yq5l8a',
    /*  slide_2_layered: 'tex10_2_i0at7t', */
    slide_2_layered: 'slide_2_layered_e7thux',
    slide_2_layered_mobile: 'slide_2_mobile_hppycs',
    slide_3_full: 'slide-3_yq5l8a',
    slide_3_layered: 'tex13_1_pinuft',
    slide_4_full: 'slide_4_full_wqgda6',
    slide_4_layered: 'tex5-2_bwcmkw',
    slide_5_full: 'slide_5_full_w0tis9',
    slide_5_layered: 'slide_5_layered_xqppdr',
    slide_6_full: 'slide_6_full_opx9qp',
    slide_6_layered: 'slide_6_layered_ewlr3k',
    slide_7_full: 'slide_7_full_wcbgyu',
    slide_7_layered: 'slide_7_layered_lcuyb4',
    slide_8_full: 'slide_8_full_xvdpvq',
    slide_8_layered: 'slide_8_layered_ypdtjp',
    slide_9_full: 'slide_9_full_tqrarb',
    slide_9_layered: 'slide_9_layered_am91co',

    // Technology Backed images
    technologyBacked1: 'technology-backed-1_r2uavn',
    technologyBacked1Mobile: 'technology-backed-1-mobile_xfzize',
    technologyBacked2: 'technology-backed-2_erxp4b',
    technologyBacked2Mobile: 'technology-backed-2-mobile_m3olql',
    technologyBacked2Full: 'technology-backed-2-full_oonmcg',
    technologyBacked3: 'technology-backed-3_yavhl2',
    technologyBacked3Mobile: 'technology-backed-3-mobile_b2hjeq',

    // Why Choose images
    whyImage1: 'why-image-1_oowjvg',
    whyImage2: 'why-image-2_thxzur',
    whyImage3: 'why-image-3_rmdyev',
    whyImage4: 'why-image-4_tburag',

    // Other
    footerSectionBg: 'footer-section-bg_folbzx',
    locationMarqueBg: 'location-marque-bg_iiov3q',
    locationMarqueBgMobile: 'location-marque-bg-mobile_inq3ca',
};

/**
 * Full URLs — use these with `next/image`, `<video poster>`, OG metadata, etc.
 */
export const homeImageUrls = Object.fromEntries(
    Object.entries(homeImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof homeImages, string>;
























