import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import { homeImageUrls } from '@/lib/images/home';
import Link from 'next/link';

import { cities } from '@/data';

export function ExpandingUsDrivers() {
    return (
        <div id='who-we-serve' className='pt-[40px] md:pt-[82px]'>
            <FadedImageCrossSection
                imageSrc={homeImageUrls.locationMarqueBg}
                imageAlt='Charging Stations By Water'
                sectionClass='max-md:-mb-22'>
                <div className='flex flex-col space-y-[32px] md:space-y-20 w-full max-w-[1440px] px-4 md:px-10 mx-auto justify-start'>
                    <FadeUp>
                        <h2 className='headline-dark text-left w-full'>
                            Expanding Across the U.S.
                        </h2>
                    </FadeUp>

                    <FadeUp
                        delay={0.1}
                        className='w-full'>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 md:gap-y-20 w-full'>
                            {cities.map((city, idx) => (
                                <div key={idx} className='flex flex-col gap-2 md:gap-4'>
                                    <h3 className='text-[20px] md:text-[28px] font-semibold md:font-bold leading-[130%] md:leading-[110%] tracking-[-0.02em] text-dark'>
                                        {city.name}
                                    </h3>
                                    <div className='flex flex-col gap-y-2 text-[16px] md:text-[20px] text-dark leading-[120%]'>
                                        <span>{city.capacity}</span>
                                        <span>{city.stationName}</span>
                                        <Link href={`tel:${city.contact.replace(/[^\d+]/g, '')}`} className='w-fit underline decoration-1 underline-offset-4 decoration-dark hover:text-dark/70 transition-colors'>
                                            {city.contact}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.2} className='relative z-20 w-full mb-30'>
                        <Link
                            href='#'
                            className='inline-flex justify-center w-full md:w-auto px-[28px] py-4 bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] transition-colors duration-500 mb-8'>
                            View All Locations
                        </Link>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

