import { PageHero } from '@/components/drivers/page-hero';
import { aboutImageUrls } from '@/lib/images/about';

import { ExpandingWithoutCrossfade } from '@/components/about/expanding-without-crossfade';
import { CTAReady } from '@/components/home/cta-ready';
import { StepGrid } from '@/components/ui/step-grid';
import { AboutPageCorePrinciplesData } from '@/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Powering the Future of EV Charging',
    description:
        'Learn about WattUp USA and our mission to build reliable charging infrastructure for the next generation of mobility.',
    openGraph: {
        title: 'About Us | Powering the Future of EV Charging',
        description:
            'Learn about WattUp USA and our mission to build reliable charging infrastructure for the next generation of mobility.',
        images: [
            {
                url: aboutImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'About Us | Powering the Future of EV Charging',
        description:
            'Learn about WattUp USA and our mission to build reliable charging infrastructure for the next generation of mobility.',
        images: [
            {
                url: aboutImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function AboutPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={aboutImageUrls.aboutPageHeroImage}
                mobileImage={aboutImageUrls.aboutPageHeroImageMobile}
                alt='About Page Hero Background'
                sectionClass=''
                imageClass='max-md:object-[45%_top]'
                overlay={false}
                heading={
                    <>
                        Powering the Future
                        <br className='hidden sm:block' />
                        of EV Charging.
                    </>
                }
                subHeading={
                    <>
                        Building reliable charging infrastructure
                        <br className='hidden sm:block' />
                        for the next generation of mobility.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='/locations#locations'
                buttonLight={true}
                buttonClass='max-md:bg-primary max-md:hover:bg-primary-hover max-md:text-white'
            />

            {/* 2. Core Principals */}
            {/*  <CorePrinciples /> */}
            <StepGrid
                heading='Our Core Principles'
                stepData={AboutPageCorePrinciplesData}
                gridClass='grid-cols-4'
                descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
                cardImageHeight='h-[373px]'
            />

            {/*  3.  Expanding Us */}
            <ExpandingWithoutCrossfade />

            {/* 4. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image={aboutImageUrls.partnerImage}
                imageClass='max-md:object-[73%_top] xl:object-bottom'
                imageWrapperClass='-mb-26'
                heading='Partner With Us'
                subHeading=' Explore the WattUp charging network.'
                buttonText='Request Assessment'
                buttonLink='/contact#contact-us'
            />
        </main>
    );
}

