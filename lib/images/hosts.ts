import { cloudinaryUrl } from './home';

export const hostsImages = {
    forHostPageHero: 'for-host-page-hero_gtxdgb',
    hostCrossfade: 'host-crossfade_qg8esb',
    hostCrossfadeMobile: 'host-crossfade-mobile_lxor4j',
    hostPageBenifitImage1: 'host-page-benifit-image-1_ttxgl2',
    hostPageBenifitImage2: 'host-page-benifit-image-2_qu3gna',
    hostPageBenifitImage3: 'host-page-benifit-image-3_o9pfx3',
    hostPageBenifitImage4: 'host-page-benifit-image-4_tyokrq',
    hostPageBenifitImageMobile1: 'host-page-benifit-image-mobile-1_az9czi',
    hostsHowItWorks1: 'hosts-how-it-works-1_cahfmn',
    hostsHowItWorks2: 'hosts-how-it-works-2_ndpmmc',
    hostsHowItWorks3: 'hosts-how-it-works-3_pjgprj',
    hostsHowItWorks4: 'hosts-how-it-works-4_hsmb2n',
    hostsHowItWorksMobile2: 'hosts-how-it-works-mobile-2_atflor',
    hostsHowItWorksMobile3: 'hosts-how-it-works-mobile-3_czfnl1',
    hostsHowItWorksMobile4: 'hosts-how-it-works-mobile-4_albz1m',
    ogImage: 'og-image_jpb70u',
    technologyBackedForHostMobile: 'technology-backed-for-host-mobile_krpfty',
    technologyBackedForHost: 'technology-backed-for-host_vn4htg',
    whyChoose1: 'why-choose-1_xuzdzt',
    whyChoose2: 'why-choose-2_j2wtxj',
    whyChoose3: 'why-choose-3_j5un9z',
    whyChoose4: 'why-choose-4_ktnlyb',
    whyChooseMobile4: 'why-choose-mobile-4_hjos1i',
};

export const hostsImageUrls = Object.fromEntries(
    Object.entries(hostsImages).map(([key, id]) => [key, cloudinaryUrl(id)])
) as Record<keyof typeof hostsImages, string>;























