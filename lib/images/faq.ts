import { cloudinaryUrl } from './home';

export const faqImages = {
    ctaImageMobile: 'cta-image-mobile_rfzgyr',
    ctaImage: 'cta-image_z0k0q0',
    heroImageMobile: 'hero-image-mobile_tn0oqi',
    heroImage: 'hero-image_kwqlgv',
    ogImage: 'og-image_nyufnd',
};

export const faqImageUrls = Object.fromEntries(
    Object.entries(faqImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof faqImages, string>;









