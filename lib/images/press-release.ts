import { cloudinaryUrl } from './home';

export const pressReleaseImages = {
    ctaImageMobile: 'cta-image-mobile_ju33cl',
    ctaImage: 'cta-image_m0wsws',
    heroImage: 'hero-image_lt5jem',
    heroImageMobile: 'hero-image-mobile_wz94ts',
    ogImage: 'og-image_dvxvml',
    pressRelease1Mobile: 'press-release-1-mobile_qxwl7t',
    pressRelease1Second: 'press-release-1-second_k9gvxs',
    pressRelease1: 'press-release-1_jlxiwh',
    pressRelease2Mobile: 'press-release-2-mobile_e7mcvl',
    pressRelease2: 'press-release-2_xnitll',
    pressRelease3Mobile: 'press-release-3-mobile_v77sn8',
    pressRelease3: 'press-release-3_fvkxol',
    pressRelease4Mobile: 'press-release-4-mobile_ctdgvc',
    pressRelease4: 'press-release-4_ndpmvq',
    pressRelease5Mobile: 'press-release-5-mobile_ed6yia',
    pressRelease5: 'press-release-5_svaggm',
    pressRelease6Mobile: 'press-release-6-mobile_ivx7zd',
    pressRelease6: 'press-release-6_idofhu',
};

export const pressReleaseImageUrls = Object.fromEntries(
    Object.entries(pressReleaseImages).map(([key, id]) => [
        key,
        cloudinaryUrl(id),
    ])
) as Record<keyof typeof pressReleaseImages, string>;




















