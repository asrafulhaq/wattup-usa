import { cloudinaryUrl } from './home';

export const pressReleaseImages = {
    ctaImageMobile: 'cta-image-mobile_ju33cl',
    ctaImage: 'cta-image_m0wsws',
    heroImage: 'hero-image_p2oc2j',
    ogImage: 'og-image_zlo0cc',
    pressRelease1Mobile: 'press-release-1-mobile_ocuhdg',
    pressRelease1Second: 'press-release-1-second_w1pqyb',
    pressRelease1: 'press-release-1_jxjaxf',
    pressRelease2Mobile: 'press-release-2-mobile_hi2kst',
    pressRelease2: 'press-release-3_pyyfrk',
    pressRelease3Mobile: 'press-release-3-mobile_lj8eyl',
    pressRelease3: 'press-release-3_pyyfrk',
    pressRelease4Mobile: 'press-release-4-mobile_mlrmuu',
    pressRelease4: 'press-release-4_a3t6bx',
    pressRelease5Mobile: 'press-release-5-mobile_c8xx9r',
    pressRelease5: 'press-release-5_sufkkv',
    pressRelease6Mobile: 'press-release-6-mobile_wjfls3',
    pressRelease6: 'press-release-6_yttreh',
};

export const pressReleaseImageUrls = Object.fromEntries(
    Object.entries(pressReleaseImages).map(([key, id]) => [
        key,
        cloudinaryUrl(id),
    ])
) as Record<keyof typeof pressReleaseImages, string>;

