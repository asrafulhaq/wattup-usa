import { cloudinaryUrl } from './home';

export const sharedImages = {
    car2: 'car-2_gvxq2h',
    car1: 'car1_haqefw',
    cardImage1: 'card-image-1_in2uvd',
    cardImage2: 'card-image-2_dmtrtw',
    cardImage4: 'card-image-4_djoelt',
    cardImage5: 'card-image-5_fa2lzk',
    faviconDarkSq: 'favicon-Dark-sq_smwilz',
    faviconLightSq: 'favicon-light-sq_jjl3ib',
    howItWorks1: 'how-it-works-1_s7csxg',
    howItWorks2: 'how-it-works-2_ojqbwq',
    howItWorks3: 'how-it-works-3_jw3izw',
    howItWorks4: 'how-it-works-4_yhkt7i',
    howItWorks5: 'how-it-works-5_yencir',
    logo: 'logo_pwgloc',
    logoSvg: 'logo_uxaxoi',
    logoDark: 'logo_dark_lo0vfz',
};

export const sharedImageUrls = Object.fromEntries(
    Object.entries(sharedImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof sharedImages, string>;

