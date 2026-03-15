import { PageHero } from '@/components/drivers/page-hero';

import { CorePrinciples } from '@/components/about/core-principles';
import { CTAReady } from '@/components/home/cta-ready';

export default function AboutPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/about-page-hero-image.png'
                alt='About Page Hero Background'
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
                buttonLink='/find-charger'
                buttonLight={true}
            />

            {/* 2. Core Principals */}
            <CorePrinciples />

            {/* 3. CTA Section */}
            <CTAReady
                image='/assets/images/partner-image.png'
                heading='Partner With Us'
                subHeading=' Explore the WattUp charging network.'
                buttonText='Request Assessment'
                buttonLink='/contact'
            />
        </main>
    );
}

