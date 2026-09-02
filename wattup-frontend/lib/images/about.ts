import { cloudinaryUrl } from './home';

export const aboutImages = {
    aboutPageHeroImageMobile: 'about-page-hero-image-mobile_wu7scr',
    aboutPageHeroImage: 'about-page-hero-image_g7uymg',
    // F18: core-principals_ghtsrs is gone from the account. No same-name sibling and no
    // cloudinary search hit (folder or filename) turned up a replacement, but
    // public/assets/images/about/core-principals.png is the same photograph, already
    // committed to the repo, so aboutImageUrls.corePrincipals below is overridden to serve
    // that file instead of a 404 from cloudinaryUrl(). The id is kept here for the record.
    corePrincipals: 'core-principals_ghtsrs',
    ogImage: 'og-image_jw0j90',
    partnerImage: 'partner-image_frpitt',
    mission: 'mission_cmmhbj',
    vision: 'vision_nwjxxw',
    future: 'future_gmxupy',
    sustainability: 'sustainability_guijzf',
};

export const aboutImageUrls: Record<keyof typeof aboutImages, string> = {
    ...(Object.fromEntries(
        Object.entries(aboutImages).map(([key, id]) => [key, cloudinaryUrl(id)])
    ) as Record<keyof typeof aboutImages, string>),
    // F18: local fallback, see the comment on aboutImages.corePrincipals above.
    corePrincipals: '/assets/images/about/core-principals.png',
};





















