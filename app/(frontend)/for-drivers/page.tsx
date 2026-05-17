import { ExpandingUsDrivers } from '@/components/drivers/expanding-us-drivers';
import { FAQSection } from '@/components/drivers/faq';
import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { ImageSliderSection } from '@/components/ui/image-slider-section';
import { ImageTitleGrid } from '@/components/ui/image-title-grid';
import { StepGrid } from '@/components/ui/step-grid';
import {
    CarginglocationsForDrivers,
    DriverFAQData,
    DriverPageHowItWorksStepData,
    DriverPageWhyChooseSlideCardData,
} from '@/data';
import { driversImageUrls } from '@/lib/images/drivers';
import type { Metadata } from 'next';

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
                url: driversImageUrls.og_image_layered,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'For Drivers | EV Charging Made Simple',
        description:
            'Find fast, reliable WattUp charging stations located where you live, work, and travel.',
        images: [
            {
                url: driversImageUrls.og_image_layered,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
            },
        ],
    },
};

export default function ForDriversPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={driversImageUrls.hero_image_layered}
                mobileImage={driversImageUrls.hero_image_mobile}
                imageClass='max-md:object-[67%] max-md:object-left xl:object-left'
                overlay={true}
                overlayClass='absolute top-0 w-full h-[400px] md:h-[951px] bg-linear-to-b from-[#54A6FF]/84 to-transparent mix-blend-multiply after:content-[""] after:absolute after:inset-0 after:bg-linear-to-b after:from-black/37 after:to-transparent'
                contentContainerClass='mb-0'
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
                buttonLink='/locations#locations'
            />

            {/* 2. How It Works */}
            <StepGrid
                gridClass='grid-cols-2 max-lg:gap-8 lg:grid-cols-3'
                stepData={DriverPageHowItWorksStepData}
            />

            {/* 3. Why Choose WATTUP Cards */}
            <ImageSliderSection slides={DriverPageWhyChooseSlideCardData} />

            {/* 4. Expanding Us */}
            <ExpandingUsDrivers />

            {/* 5. Charging Where You Go */}
            <ImageTitleGrid
                heading='Charging where you go'
                items={CarginglocationsForDrivers}
            />

            {/* 6. Driver FAQ */}
            <FAQSection
                faqs={DriverFAQData}
                image={driversImageUrls.faqImage}
            />

            {/* 7. Why Choose WATTUP Cards */}
            <CTAReady
                headingClass='max-md:w-[233px] mx-auto '
                heading='Find a Charger Near You'
                subHeading='Explore the WattUp charging network.'
                buttonText='Find Locations'
                buttonLink='/locations#locations'
            />
        </main>
    );
}

