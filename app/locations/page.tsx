import { FindLocation } from '@/components/drivers/find-location';
import { PageHero } from '@/components/drivers/page-hero';

export default function LocationsPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/location-page-hero-bg.png'
                alt='Location Page Hero Background'
                heading=' Find a Charging Station'
                subHeading={
                    <>
                        Explore WattUp locations across our
                        <br className='hidden sm:block' />
                        network.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='/find-charger'
            />

            {/* 2. Find Location */}
            <FindLocation />
        </main>
    );
}

