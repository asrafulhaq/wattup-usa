import { cloudinaryUrl } from './home';

/**
 * Public IDs for Capital Partners page images.
 * TODO: Replace placeholder IDs with real Cloudinary public IDs once uploaded.
 */
export const capitalPartnersImages = {
    // Hero
    heroImage: 'hero-image_sptojh',
    heroImageMobile: 'hero-image-mobile_tgjqce',

    // OG / Social
    ogImage: 'og-image_ntkkbu',

    // Leadership section
    leadership: 'leadership_noqurf',
    leadershipMobile: 'leadership-mobile_ooff6h',

    // Why Choose section
    why1: 'why-1_zoua7e',
    why2: 'why-2_imp5z6',
    why3: 'why-3_mdz9sz',
    why4: 'why-4_sffnuw',
};

/**
 * Full Cloudinary URLs — use these with `next/image`, OG metadata, etc.
 * Falls back gracefully once images are uploaded with matching public IDs.
 */
export const capitalPartnersImageUrls = Object.fromEntries(
    Object.entries(capitalPartnersImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof capitalPartnersImages, string>;










