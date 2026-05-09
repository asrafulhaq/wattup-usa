import { cloudinaryUrl } from './home';

export const hostsImages = {
    forHostPageHero: 'for-host-page-hero_s7ufgi',
    hostCrossfade: 'host-crossfade_jkl5k1',
    hostCrossfadeMobile: 'host-crossfade-mobile_hn2tsb',
    hostPageBenifitImage1: 'host-page-benifit-image-1_whykci',
    hostPageBenifitImage2: 'host-page-benifit-image-2_zv69je',
    hostPageBenifitImage3: 'host-page-benifit-image-3_c7ci06',
    hostPageBenifitImage4: 'host-page-benifit-image-4_zx5cje',
    hostPageBenifitImageMobile1: 'host-page-benifit-image-mobile-1_wr1qkq',
    hostsHowItWorks1: 'hosts-how-it-works-1_c0u2pz',
    hostsHowItWorks2: 'hosts-how-it-works-2_vacae1',
    hostsHowItWorks3: 'hosts-how-it-works-mobile-3_hvue9t',
    hostsHowItWorks4: 'hosts-how-it-works-4_jskejg',
    hostsHowItWorksMobile1: 'hosts-how-it-works-mobile-1_djsfcg',
    hostsHowItWorksMobile2: 'hosts-how-it-works-mobile-2_znjxyl',
    hostsHowItWorksMobile3: 'hosts-how-it-works-mobile-3_ogmpfr',
    hostsHowItWorksMobile4: 'hosts-how-it-works-mobile-4_q5yij2',
    ogImage: 'og-image_gd5tpf',
    technologyBackedForHostMobile: 'technology-backed-for-host_elcxcg',
    technologyBackedForHost: 'technology-backed-for-host_elcxcg',
    whyChoose1: 'why-choose-1_qatoos',
    whyChoose2: 'why-choose-2_oudtsq',
    whyChoose3: 'why-choose-3_nyxion',
    whyChoose4: 'why-choose-4_mwmbjg',
    whyChooseMobile4: 'why-choose-mobile-4_bli5rc',
};

export const hostsImageUrls = Object.fromEntries(
    Object.entries(hostsImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof hostsImages, string>;
























































