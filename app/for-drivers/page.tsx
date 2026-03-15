import { ChargingWhereYouGo } from '@/components/drivers/charging-where-you-go';
import { DriverFAQ } from '@/components/drivers/driver-faq';
import { FindLocation } from '@/components/drivers/find-location';
import { PageHero } from '@/components/drivers/page-hero';
import { CTAReady } from '@/components/home/cta-ready';
import { HowItWorks } from '@/components/home/how-it-works';
import { WhyChoose } from '@/components/home/why-choose';

export default function ForDriversPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero />

            {/* 2. How It Works */}
            <HowItWorks />

            {/* 3. Why Choose WATTUP Cards */}
            <WhyChoose />

            {/* 4. Find Location */}
            <FindLocation />

            {/* 5. Charging Where You Go */}
            <ChargingWhereYouGo />

            {/* 6. FAQ */}

            {/* 6. Driver FAQ */}
            <DriverFAQ />

            {/* 7. Why Choose WATTUP Cards */}
            <CTAReady
                heading={
                    <h2 className='headline-white pb-6'>
                        Find a Charger Near You
                    </h2>
                }
                subHeading={
                    <p className='text-lg md:text-[20px] font-normal max-w-[424px] mx-auto mb-8 leading-[120%] text-white'>
                        Explore the WattUp charging network.
                    </p>
                }
                buttonText='Find Locations'
                buttonLink='/locations'
            />
        </main>
    );
}

