import { cloudinaryUrl } from './home';

export const faqImages = {
    ctaImageMobile: 'cta-image-mobile_b1v6it',
    ctaImage: 'cta-image_x4bpgk',
    heroImageMobile: 'hero-image-mobile_lwiohs',
    heroImage: 'hero-image_nc5do7',
    ogImage: 'og-image_nyufnd',
};

export const faqImageUrls = Object.fromEntries(
    Object.entries(faqImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof faqImages, string>;





