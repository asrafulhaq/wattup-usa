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

    // Technology Backed images
    technologyBacked1: 'technology-backed-1_mqtdbs',
    technologyBacked1Mobile: 'technology-backed-1-mobile_xt6vea',
    technologyBacked2: 'technology-backed-2_jrdtnd',
    technologyBacked2Mobile: 'technology-backed-2-mobile_cmc8lg',
    technologyBacked3: 'technology-backed-3_uvyuzh',
    technologyBacked3Mobile: 'technology-backed-3-mobile_axzpwq',

    // Why Choose images
    whyImage1: 'why-image-1_oowjvg',
    whyImage2: 'why-image-2_thxzur',
    whyImage3: 'why-image-3_rmdyev',
    whyImage4: 'why-image-4_tburag',

    // Other
    footerSectionBg: 'footer-section-bg_cf3tkx',
    locationMarqueBg: 'location-marque-bg_nibwtw',
};

/**
 * Full URLs — use these with `next/image`, `<video poster>`, OG metadata, etc.
 */
export const homeImageUrls = Object.fromEntries(
    Object.entries(homeImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof homeImages, string>;

