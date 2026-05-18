import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { BlogPostList } from '@/components/press-release/blog-post-list';
import { BlogPostListSkeleton } from '@/components/skeletons/blog-post-list-skeleton';
import { pressReleaseImageUrls } from '@/lib/images/press-release';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Press Release | WattUp EV Charging',
    description:
        'WattUp is a leading EV charging network in the USA, providing reliable and convenient EV charging solutions for drivers and property owners.',
    openGraph: {
        title: 'Press Release | WattUp EV Charging',
        description:
            'WattUp is a leading EV charging network in the USA, providing reliable and convenient EV charging solutions for drivers and property owners.',
        images: [
            {
                url: pressReleaseImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'Press Release | WattUp EV Charging',
        description:
            'WattUp is a leading EV charging network in the USA, providing reliable and convenient EV charging solutions for drivers and property owners.',
        images: [
            {
                url: pressReleaseImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function PressReleasePage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={pressReleaseImageUrls.heroImage}
                mobileImage={pressReleaseImageUrls.heroImageMobile}
                alt='Press Release Page Hero Background'
                heading='Media'
                imageClass='max-md:object-[15%_bottom]'
                sectionClass='max-md:h-[530px] md:h-[810px]! items-start! text-left!'
                contentContainerClass='items-start! w-full text-left!'
                textContainerClass='items-start text-left'
                headingClass='text-left! text-nowrap max-md:hidden'
                overlay
            />

            {/* 2. Press Release */}
            <Suspense fallback={<BlogPostListSkeleton />}>
                <BlogPostList />
            </Suspense>
            {/* 3. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image={pressReleaseImageUrls.ctaImage}
                mobileImage={pressReleaseImageUrls.ctaImageMobile}
                heading='Partner With Us'
                subHeading='Explore the WattUp charging network.'
                buttonText='Request Assessment'
                buttonLink='/contact#contact-us'
            />
        </main>
    );
}

