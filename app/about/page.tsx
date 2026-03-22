import { PageHero } from '@/components/drivers/page-hero';

import { CorePrinciples } from '@/components/about/core-principles';
import { CTAReady } from '@/components/home/cta-ready';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Powering the Future of EV Charging',
    description:
        'Learn about WattUp USA and our mission to build reliable charging infrastructure for the next generation of mobility.',
};

export default function AboutPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/about-page-hero-image.png'
                mobileImage='/assets/images/about-page-hero-image-mobile.png'
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
                buttonLink='#'
                buttonLight={true}
                buttonClass='max-md:bg-primary max-md:hover:bg-primary-hover max-md:text-white'
            />

            {/* 2. Core Principals */}
            <CorePrinciples />

            {/* 3. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image='/assets/images/partner-image.png'
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

