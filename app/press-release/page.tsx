import { pressReleaseImageUrls } from '@/lib/images/press-release';
import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { PressReleaseArchive } from '@/components/press-release/press-release-archive';
import type { Metadata } from 'next';
import { baseUrl } from '../page';

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
                alt='Press Release Page Hero Background'
                heading='Press release archive'
                imageClass='max-md:object-[15%_bottom]'
                sectionClass='max-md:h-[530px] md:h-[810px]! items-start! text-left!'
                contentContainerClass='items-start! w-full text-left!'
                textContainerClass='items-start text-left'
                headingClass='text-left! text-nowrap'
                overlay
            />

            {/* 2. Press Release */}
            <PressReleaseArchive />

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

