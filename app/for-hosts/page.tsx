import { ChargingWhereYouGo } from '@/components/drivers/charging-where-you-go';
import { PageHero } from '@/components/drivers/page-hero';
import { WhyChoose } from '@/components/home/why-choose';
import { BringEvToProperty } from '@/components/hosts/bring-ev-to-property';
import { HowItWorksForHosts } from '@/components/hosts/how-it-works-hosts';
import { TechnologyBacked } from '@/components/hosts/technology-backed';
import {
    HostPageBenifitsCardsData,
    HostPageWhyChooseSlideCardData,
    IdealLocationsForHosts,
} from '@/data';

export default function ForHostPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/for-host-page-hero.png'
                alt='Driver Page Hero Background'
                heading={
                    <>
                        Turn Your Property Into
                        <br className='hidden sm:block' />a Charging Destination
                    </>
                }
                subHeading={
                    <>
                        Install EV charging and attract new
                        <br className='hidden sm:block' />
                        customers, tenants, and visitors.
                    </>
                }
                buttonText='Request Partnership'
                buttonLink='/contact'
            />

            {/* 2. Why Choose WATTUP Cards */}
            <WhyChoose
                heading='Why Install EV charging'
                slides={HostPageWhyChooseSlideCardData}
            />

            {/* 3. How It Works */}
            <HowItWorksForHosts />

            {/* 4. Technology Backed */}
            <TechnologyBacked />

            {/* 5. Benifits Cards */}
            <WhyChoose
                heading='Generate Revenue From Charging'
                slides={HostPageBenifitsCardsData}
            />

            {/* 6. Charging Where You Go */}
            <ChargingWhereYouGo
                heading='Ideal locations'
                locations={IdealLocationsForHosts}
            />
            {/* 7. Bring EV to property */}
            <BringEvToProperty />
        </main>
    );
}

