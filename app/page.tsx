import { BuiltFor } from '@/components/home/built-for';
import { CTAReady } from '@/components/home/cta-ready';
import { ExpandingUs } from '@/components/home/expanding-us';
import { FutureMobility } from '@/components/home/future-mobility';
import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { TechnologyBacked } from '@/components/home/technology-backed';
import { VideoPresentation } from '@/components/home/video-presentation';
import { WhyChoose } from '@/components/home/why-choose';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EV Charging for Properties & Drivers',
    description: 'Powering the future of EV charging with reliable, fast, and accessible charging solutions for drivers and property owners.',
};

export default function Home() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 1. Hero / Header Section */}
            <Hero />

            {/* 2. Drivers and Property Owners */}
            <BuiltFor />

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
                buttonLink='/find-charger'
                buttonText2='Partner With Us'
                buttonLink2='/partner'
            />
        </main>
    );
}

