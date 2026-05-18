import { PageHero } from '@/components/drivers/page-hero';
import { BringEvToProperty } from '@/components/hosts/bring-ev-to-property';
import { TechnologyBacked } from '@/components/hosts/technology-backed';
import { ImageSliderSection } from '@/components/ui/image-slider-section';
import { ImageTitleGrid } from '@/components/ui/image-title-grid';
import { StepGrid } from '@/components/ui/step-grid';
import {
    HostPageBenifitsCardsData,
    HostPageHowItWorksStepsData,
    HostPageWhyChooseSlideCardData,
    IdealLocationsForHosts,
} from '@/data';
import { hostsImageUrls } from '@/lib/images/hosts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'For Property Hosts | Turn Your Property Into a Charging Destination',
    description:
        'Partner with WattUp to install EV charging and attract new customers, tenants, and visitors to your commercial property.',
    openGraph: {
        title: 'For Hosts | Turn Your Property Into a Charging Destination',
        description:
            'Partner with WattUp to install EV charging and attract new customers, tenants, and visitors to your commercial property.',
        images: [
            {
                url: hostsImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'For Hosts | Turn Your Property Into a Charging Destination',
        description:
            'Partner with WattUp to install EV charging and attract new customers, tenants, and visitors to your commercial property.',
        images: [
            {
                url: hostsImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function ForHostPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={hostsImageUrls.forHostPageHero}
                alt='Driver Page Hero Background'
                heading={
                    <>
                        Turn Your Property Into{' '}
                        <br className='hidden md:block' />a Charging Destination
                    </>
                }
                imageClass='max-md:object-[41%]'
                headingClass='max-md:w-[348px]'
                subHeading={
                    <>
                        Install EV charging and attract new
                        <br className='hidden sm:block' />
                        customers, tenants, and visitors.
                    </>
                }
                buttonText='Request Partnership'
                buttonLink='/contact#contact-us'
            />

            {/* 2. Why Choose WATTUP Cards */}
            <ImageSliderSection
                headingClass='max-md:max-w-[205px]'
                heading='Why Install EV charging'
                slides={HostPageWhyChooseSlideCardData}
            />

            {/* 3. How It Works */}
            <StepGrid 
                heading='How It Works'
                stepData={HostPageHowItWorksStepsData}
                gridClass='grid-cols-2'
                cardImageHeight='h-[370px]'
                sectionClass='max-w-[1444px] mx-auto !bg-transparent'
            />

            {/* 4. Technology Backed */}
            <TechnologyBacked />

            {/* 5. Benifits Cards */}
            <ImageSliderSection
                heading='Generate Revenue From Charging'
                slides={HostPageBenifitsCardsData}
                headingClass='max-md:w-[348px]'
            />

            {/* 6. Charging Where You Go */}
            <ImageTitleGrid
                heading='Ideal locations'
                items={IdealLocationsForHosts}
            />
            {/* 7. Bring EV to property */}
            <BringEvToProperty />
        </main>
    );
}

