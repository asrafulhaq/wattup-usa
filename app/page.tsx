import { BuiltFor } from '@/components/home/built-for';
import { CtaFooter } from '@/components/home/cta-footer';
import { ExpandingUs } from '@/components/home/expanding-us';
import { FutureMobility } from '@/components/home/future-mobility';
import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { TechnologyBacked } from '@/components/home/technology-backed';
import { WhyChoose } from '@/components/home/why-choose';

export default function Home() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 1. Hero / Header Section */}
            <Hero />

            {/* 2. Drivers and Property Owners */}
            <BuiltFor />

            {/* 3. Future of Mobility Features */}
            <FutureMobility />

            {/* 4. Video Technology Banner */}
            <TechnologyBacked />

            {/* 5. How It Works Steps */}
            <HowItWorks />

            {/* 6. Expanding Locations */}
            <ExpandingUs />

            {/* 7. Why Choose WATTUP Cards */}
            <WhyChoose />

            {/* 8. Call to Action / Footer */}
            <CtaFooter />
        </main>
    );
}

