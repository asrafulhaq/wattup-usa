import { BuiltFor } from '@/components/home/built-for';
import { CTAReady } from '@/components/home/cta-ready';
import { ExpandingUs } from '@/components/home/expanding-us';
import { FutureMobility } from '@/components/home/future-mobility';
import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { TechnologyBacked } from '@/components/home/technology-backed';
import { VideoPresentation } from '@/components/home/video-presentation';
import { WhyChoose } from '@/components/home/why-choose';
import { HomePageWhyChooseSlideCardData } from '@/data';
import type { Metadata } from 'next';
export const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app/';
export const metadata: Metadata = {
    title: 'EV Charging for Properties & Drivers',
    description:
        'Powering the future of EV charging with reliable, fast, and accessible charging solutions for drivers and property owners.',
    openGraph: {
        title: 'EV Charging for Properties & Drivers',
        description:
            'Powering the future of EV charging with reliable, fast, and accessible charging solutions for drivers and property owners.',
        images: [
            {
                url: `${baseUrl}/assets/images/home/hero-1-md.png`,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'EV Charging for Properties & Drivers',
        description:
            'Powering the future of EV charging with reliable, fast, and accessible charging solutions for drivers and property owners.',
        images: [
            {
                url: `${baseUrl}/assets/images/home/hero-1-md.png`,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function Home() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 1. Hero / Header Section */}
            <Hero />

            {/* 2. Drivers and Property Owners */}
            <BuiltFor cardDescriptionClass='max-md:text-[16px]!' />

            {/* 3. Future of Mobility Features */}
            <FutureMobility />

            {/* 4. Video Presentation */}
            <VideoPresentation />

            {/* 5. How It Works */}
            <HowItWorks />

            {/* 6. Technology Backed */}
            {/*    <TechnologyBackedXPercent /> */}
            <TechnologyBacked />

            {/* 7. Expanding Locations */}
            <ExpandingUs />

            {/* 7. Why Choose WATTUP Cards */}
            <WhyChoose
                slides={HomePageWhyChooseSlideCardData}
                heading='Why Choose WattUp'
                headingClass='max-md:max-w-[348px] max-md:text-nowrap'
            />

            {/* 8. Call to Action */}
            <CTAReady
                heading={
                    <>
                        Ready to Charge
                        <br />
                        with WattUp?
                    </>
                }
                subHeading={
                    <>
                        Find a charging station near you or partner
                        <br className='hidden md:block' />
                        with us to bring EV charging to your property.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='#'
                buttonText2='Partner With Us'
                buttonLink2='/contact#contact-us'
            />
        </main>
    );
}

