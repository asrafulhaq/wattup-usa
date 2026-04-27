import { cloudinaryUrl } from './home';

export const sharedImages = {
    car2: 'car-2_b32pww',
    car1: 'car1_qupfhr',
    cardImage1: 'card-image-1_swqhxv',
    cardImage2: 'card-image-2_issnnu',
    cardImage4: 'card-image-3_cgilny',
    cardImage5: 'card-image-4_t4ibeu',
    faviconDarkSq: 'favicon-Dark-sq_smwilz',
    faviconLightSq: 'favicon-light-sq_jjl3ib',
    howItWorks1: 'how-it-works-1_rrkbrn',
    howItWorks2: 'how-it-works-2_ygplq3',
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











