import { default as ImageSectionFade } from '@/components/capital-partners/image-section-fade';
import { SectionIntro } from '@/components/capital-partners/section-intro';
import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { TextGridSection } from '@/components/home/future-mobility';
import { TechnologyBacked } from '@/components/hosts/technology-backed';
import { ImageSliderSection } from '@/components/ui/image-slider-section';
import { ImageTitleGrid } from '@/components/ui/image-title-grid';
import { StepGrid } from '@/components/ui/step-grid';
import {
    FleetDeploymentProcessData,
    FleetPageSolutionsData,
    FleetSectionWhyData,
    FleetSolutionPageWhyChooseSlideCardData,
    FleetSolutionReliabilityData,
    FleetSolutionStepData,
} from '@/data';
import { fleetSolutionImageUrls } from '@/lib/images/fleet-solution';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fleet Solutions | WattUp USA',
    description:
        'Fleet Electrification Made Simple. Turn any parking lot, depot, or facility into a reliable EV charging hub with WattUp USA’s end-to-end infrastructure solutions.',
    openGraph: {
        title: 'Fleet Solutions | WattUp USA',
        description:
            'Fleet Electrification Made Simple. Turn any parking lot, depot, or facility into a reliable EV charging hub with WattUp USA’s end-to-end infrastructure solutions.',
        images: [
            {
                url: fleetSolutionImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'Fleet Solutions | WattUp USA',
        description:
            'Fleet Electrification Made Simple. Turn any parking lot, depot, or facility into a reliable EV charging hub with WattUp USA’s end-to-end infrastructure solutions.',
        images: [
            {
                url: fleetSolutionImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function FleetSolutionPage() {
    return (
        <main className='flex min-h-screen w-full flex-col bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={fleetSolutionImageUrls.heroImage}
                mobileImage={fleetSolutionImageUrls.heroImageMobile}
                alt='Fleet Solution Page Hero Background'
                sectionClass='h-[448px] md:h-[554px]!'
                imageClass='xl:object-bottom'
            />

            {/* 02. Intro */}
            <SectionIntro
                heading={
                    <>
                        EV Charging Solutions <br />
                        for Your Fleet
                    </>
                }
                description={
                    <>
                        <p className='text-[16px] font-normal! md:text-[20px] leading-[130%]  md:text-dark/70'>
                            Reliable, scalable charging infrastructure designed
                            for commercial fleets.
                        </p>
                    </>
                }
                ctaText='Request Consultation'
                ctaLink='/contact#contact-us'
            />

            {/*  03. Build For */}
            <ImageSectionFade
                image={fleetSolutionImageUrls.commercial}
                mobileImage={fleetSolutionImageUrls.commercialMobile}
                heading={'Built for Commercial Fleets'}
                subHeading={
                    'WattUp provides end-to-end EV charging solutions tailored for fleet operators — from infrastructure planning to ongoing network management.'
                }
                sectionClass='pb-0!'
                subHeadingClass='md:mb-[60px]'
                imageHeight='h-[480px] xs:h-[790px] sm:h-[500px] md:h-[750px] lg:h-[900px] xl:h-[995px] 2xl:h-[1050px]! 3xl:h-[1650px]! ultra:h-[1790px]!'
            />

            {/* 04. Why Choose WattUp for Your Fleet */}
            <StepGrid
                heading='Why Choose WattUp for Your Fleet'
                stepData={FleetSectionWhyData}
                gridClass='grid-cols-2 max-lg:gap-8 lg:grid-cols-4!'
                descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
                titleClass='text-[28px]! font-bold!'
                cardImageHeight='h-[373px]'
            />

            {/* 05. Why Choose WattUp*/}
            <ImageSliderSection
                slides={FleetSolutionPageWhyChooseSlideCardData}
                heading='Why Choose WattUp'
                headingClass='max-md:max-w-[348px] max-md:text-nowrap'
            />
            {/* 06. Simple Deployment Process */}

            <ImageTitleGrid
                headingClass='text-wrap'
                heading='Simple Deployment Process'
                items={FleetDeploymentProcessData}
            />

            {/* 06. Solutions for Every Fleet */}
            <TextGridSection
                heading='Solutions for Every Fleet'
                data={FleetPageSolutionsData}
                titleClass='text-[32px]! font-semibold! md:font-bold! md:text-[28px]!'
            />

            {/* 07. Solutions for Every Fleet */}
            <StepGrid
                heading='Solutions for Every Fleet'
                stepData={FleetSolutionStepData}
                gridClass='grid-cols-2 max-lg:gap-8 lg:grid-cols-4!'
                descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
                titleClass='text-[28px]! font-bold!'
                cardImageHeight='h-[373px]'
            />
            {/* 8. Technology Backed */}
            <TechnologyBacked />

            {/* 09. Built for Reliability
             */}
            <StepGrid
                heading='Built for Reliability'
                stepData={FleetSolutionReliabilityData}
                descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
                gridClass='grid-cols-2 max-lg:gap-8 lg:grid-cols-3!'
                titleClass='text-[28px]! font-bold!'
                cardImageHeight='h-[373px]'
            />
            {/* 10.CTA Section */}
            <CTAReady
                headingClass='max-md:w-[233px] mx-auto headline-dark text-nowrap'
                subHeadingClass='text-dark'
                heading={
                    <>
                        Power Your Fleet <br /> with WattUp
                    </>
                }
                subHeading={
                    <>
                        Deploy reliable EV charging infrastructure <br /> for
                        your business
                    </>
                }
                mobileHeading='Partner With Us'
                mobileSubHeading='Explore the WattUp charging network.'
                buttonText='Request Consultation'
                mobileButtonText='Request Assessment'
                buttonLink='/contact#contact-us'
                image={fleetSolutionImageUrls.ctaImage}
                mobileImage={fleetSolutionImageUrls.ctaImageMobile}
            />
        </main>
    );
}

