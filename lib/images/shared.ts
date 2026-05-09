import { cloudinaryUrl } from './home';

export const sharedImages = {
    car2: 'car-2_ng1fff',
    car1: 'car1_zojtep',
    cardImage1: 'card-image-1_swqhxv',
    cardImage1Mobile: 'card-image-1-mobile_p6w9o2',
    cardImage2: 'card-image-2_issnnu',
    cardImage4: 'card-image-3_cgilny',
    cardImage5: 'card-image-4_t4ibeu',
    faviconDarkSq: 'favicon-Dark-sq_smwilz',
    faviconLightSq: 'favicon-light-sq_jjl3ib',
    howItWorks1: 'how-it-works-1_e5kxxo',
    howItWorks2: 'how-it-works-2_tjoj6i',
    howItWorks3: 'how-it-works-3_xkxjzt',
    howItWorks4: 'how-it-works-4_yhkt7i',
    howItWorks5: 'how-it-works-5_yencir',
    logo: 'logo_pwgloc',
    logoSvg: 'logo_uxaxoi',
    logoDark: 'logo_dark_lo0vfz',
};

export const sharedImageUrls = Object.fromEntries(
    Object.entries(sharedImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof sharedImages, string>;







