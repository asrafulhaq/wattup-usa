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
    //
    // Seven entries were removed here on 2026-09-02 (finding F18, checklist B.16):
    // hero1, hero2, hero2Md, homepageHero1, slide_1_full, slide_2_full and slide_3_full
    // all named public ids the Cloudinary account no longer holds, and nothing in the
    // app read any of them. An entry that points at a missing asset and is used by
    // nothing is a trap: the next person to reach for a hero image would have picked one
    // and shipped a broken page. scripts/check-image-ids.ts now passes on every id here.
    // F18: hero-1-md_kw0ekh (the site-wide OG image in app/layout.tsx) is gone from the
    // account. No sibling of that name exists, but og-image_wk8avs sits unreferenced in the
    // same assets/images/home folder, sized 1200x630 to match the OG dimensions layout.tsx
    // declares, so it is the intended asset rather than a guess.
    hero1Md: 'og-image_wk8avs',
    homepageHero3: 'homepage-hero-3_j6mbva',
    homepageHero4: 'homepage-hero-4_redtht',
    homepageHero5: 'homepage-hero-5_icjktz',

    /* slide_1_layered: 'tex7-8_ik0ahw', */
    slide_1_layered: 'slide_1_layered_unuk3w',
    slide_1_layered_mobile: 'slide_1_mobile_pyp6mm',
    slide_1_full_mobile: 'slide_1_mobile_pyp6mm',

    /*  slide_2_layered: 'tex10_2_i0at7t', */
    slide_2_layered: 'slide_2_layered_e7thux',
    slide_2_layered_mobile: 'slide_2_mobile_hppycs',
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
























