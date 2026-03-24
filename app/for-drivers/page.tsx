import { ChargingWhereYouGo } from '@/components/drivers/charging-where-you-go';
import { DriverFAQ } from '@/components/drivers/driver-faq';
import { FindLocation } from '@/components/drivers/find-location';
import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { HowItWorks } from '@/components/home/how-it-works';
import { WhyChoose } from '@/components/home/why-choose';
import {
    CarginglocationsForDrivers,
    DriverPageHowItWorksStepData,
    DriverPageWhyChooseSlideCardData,
} from '@/data';
import type { Metadata } from 'next';
import { baseUrl } from '../page';

export const metadata: Metadata = {
    title: 'For Drivers | EV Charging Made Simple',
    description:
        'Find fast, reliable WattUp charging stations located where you live, work, and travel.',
    openGraph: {
        title: 'For Drivers | EV Charging Made Simple',
        description:
            'Find fast, reliable WattUp charging stations located where you live, work, and travel.',
        images: [
            {
                url: `${baseUrl}/assets/images/drivers/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'For Drivers | EV Charging Made Simple',
        description:
            'Find fast, reliable WattUp charging stations located where you live, work, and travel.',
        images: [
            {
                url: `${baseUrl}/assets/images/drivers/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function ForDriversPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/drivers/for-driver-page-hero.png'
                mobileImage='/assets/images/drivers/for-driver-page-hero-mobile.png'
                imageClass='max-md:object-[67%]'
                overlay={true}
                overlayClass='absolute top-0 w-full h-[400px] md:h-[951px] bg-linear-to-b from-[#54A6FF]/84 to-transparent mix-blend-multiply after:content-[""] after:absolute after:inset-0 after:bg-linear-to-b after:from-black/37 after:to-transparent'
                alt='Driver Page Hero Background'
                heading='EV Charging Made Simple'
                subHeading={
                    <>
                        Fast, reliable charging stations located
                        <br className='hidden sm:block' />
                        where you live, work, and travel.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='#'
            />

            {/* 2. How It Works */}
            <HowItWorks stepData={DriverPageHowItWorksStepData} />

            {/* 3. Why Choose WATTUP Cards */}
            <WhyChoose slides={DriverPageWhyChooseSlideCardData} />

            {/* 4. Find Location */}
            <FindLocation />

            {/* 5. Charging Where You Go */}
            <ChargingWhereYouGo
                heading='Charging where you go'
                locations={CarginglocationsForDrivers}
            />

            {/* 6. Driver FAQ */}
            <DriverFAQ />

            {/* 7. Why Choose WATTUP Cards */}
            <CTAReady
                headingClass='max-md:w-[233px] mx-auto '
                heading='Find a Charger Near You'
                subHeading='Explore the WattUp charging network.'
                buttonText='Find Locations'
                buttonLink='#'
            />
        </main>
    );
}

