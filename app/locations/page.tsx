import { FindLocation } from '@/components/drivers/find-location';
import { PageHero } from '@/components/drivers/page-hero';

export default function LocationsPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/location-page-hero-bg.png'
                mobileImage='/assets/images/location-page-hero-bg-mobile.png'
                alt='Location Page Hero Background'
                heading=' Find a Charging Station'
                imageClass='max-md:object-[16%] xl:object-bottom'
                imageWrapperClass='max-md:-mb-[145px]'
                headingClass='max-md:text-nowrap'
                subHeadingClass='max-w-[256px]'
                overlay={true}
                subHeading={
                    <>
                        Explore WattUp locations across our{' '}
                        <br className='hidden md:block' />
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

