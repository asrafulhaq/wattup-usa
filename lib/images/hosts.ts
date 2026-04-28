import { cloudinaryUrl } from './home';

export const hostsImages = {
    forHostPageHero: 'for-host-page-hero_wiccqt',
    hostCrossfade: 'host-crossfade_plnmtw',
    hostCrossfadeMobile: 'host-crossfade-mobile_lxor4j',
    hostPageBenifitImage1: 'host-page-benifit-image-1_whykci',
    hostPageBenifitImage2: 'host-page-benifit-image-2_zv69je',
    hostPageBenifitImage3: 'host-page-benifit-image-3_c7ci06',
    hostPageBenifitImage4: 'host-page-benifit-image-4_zx5cje',
    hostPageBenifitImageMobile1: 'host-page-benifit-image-mobile-1_wr1qkq',
    hostsHowItWorks1: 'hosts-how-it-works-1_yyp013',
    hostsHowItWorks2: 'hosts-how-it-works-2_vacae1',
    hostsHowItWorks3: 'hosts-how-it-works-3_co9ghq',
    hostsHowItWorks4: 'hosts-how-it-works-4_jskejg',
    hostsHowItWorksMobile1: 'hosts-how-it-works-mobile-1_djsfcg',
    hostsHowItWorksMobile2: 'hosts-how-it-works-mobile-2_znjxyl',
    hostsHowItWorksMobile3: 'hosts-how-it-works-mobile-3_ogmpfr',
    hostsHowItWorksMobile4: 'hosts-how-it-works-mobile-4_q5yij2',
    ogImage: 'og-image_jpb70u',
    technologyBackedForHostMobile: 'technology-backed-for-host-mobile_krpfty',
    technologyBackedForHost: 'technology-backed-for-host_vn4htg',
    whyChoose1: 'why-choose-1_qatoos',
    whyChoose2: 'why-choose-2_oudtsq',
    whyChoose3: 'why-choose-3_b5ntxl',
    whyChoose4: 'why-choose-4_nhrtev',
    whyChooseMobile4: 'why-choose-mobile-4_bli5rc',
};

export const hostsImageUrls = Object.fromEntries(
    Object.entries(hostsImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof hostsImages, string>;















































