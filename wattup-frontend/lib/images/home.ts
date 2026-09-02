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
    // MISSING (F18): hero-1_cufyrq is gone from the account and unused by any page or
    // component (checked lib/images/home.ts consumers repo-wide); no same-name sibling and
    // no cloudinary search hit, so nothing to repoint to. Left as-is.
    hero1: 'hero-1_cufyrq',
    // F18: hero-1-md_kw0ekh (the site-wide OG image in app/layout.tsx) is gone from the
    // account. No sibling of that name exists, but og-image_wk8avs sits unreferenced in the
    // same assets/images/home folder, sized 1200x630 to match the OG dimensions layout.tsx
    // declares, so it is the intended asset rather than a guess.
    hero1Md: 'og-image_wk8avs',
    // MISSING (F18): hero-2_bk5zds — unused anywhere in the app, no sibling, no search hit.
    hero2: 'hero-2_bk5zds',
    // MISSING (F18): hero-2-md_jq8set — unused anywhere in the app, no sibling, no search hit.
    hero2Md: 'hero-2-md_jq8set',
    // MISSING (F18): homepage-hero-1_dh8gwz — unused anywhere in the app; homepage-hero-3/4/5
    // survive but no homepage-hero-1 or homepage-hero-2 sibling exists in the account.
    homepageHero1: 'homepage-hero-1_dh8gwz',
    homepageHero3: 'homepage-hero-3_j6mbva',
    homepageHero4: 'homepage-hero-4_redtht',
    homepageHero5: 'homepage-hero-5_icjktz',

    // MISSING (F18): slide-1_yq5l8a — unused by components/home/hero.tsx, which renders
    // slide_1_layered for this slot, never slide_1_full. slide_1_layered_unuk3w is a
    // different, already-in-use asset (confirmed distinct role from slides 4-9, where both
    // full and layered exist as separate images), so it was not substituted here.
    slide_1_full: 'slide-1_yq5l8a',
    /* slide_1_layered: 'tex7-8_ik0ahw', */
    slide_1_layered: 'slide_1_layered_unuk3w',
    slide_1_layered_mobile: 'slide_1_mobile_pyp6mm',
    slide_1_full_mobile: 'slide_1_mobile_pyp6mm',

    // MISSING (F18): slide-2_yq5l8a — same as slide_1_full above: unused, no matching "full"
    // sibling in the account, the existing slide_2_layered is a different asset.
    slide_2_full: 'slide-2_yq5l8a',
    /*  slide_2_layered: 'tex10_2_i0at7t', */
    slide_2_layered: 'slide_2_layered_e7thux',
    slide_2_layered_mobile: 'slide_2_mobile_hppycs',
    // MISSING (F18): slide-3_yq5l8a — same as slide_1_full/slide_2_full above.
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
























