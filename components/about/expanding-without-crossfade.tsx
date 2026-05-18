'use client';

import { FadeUp } from '@/components/ui/fade-up';
import { WattupButton } from '@/components/ui/wattup-button';
import { useRef } from 'react';

import { cities } from '@/data';

export function ExpandingWithoutCrossfade() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Always show 8 initially, unless showAll is true on the locations page
    const visibleCities = cities.slice(0, 8);
    return (
        <div id='locations' className='pt-[40px] md:pt-[82px]'>
            <div className='flex flex-col space-y-[32px] md:space-y-20 w-full max-w-[1440px] px-4 md:px-10 mx-auto justify-start'>
                <FadeUp>
                    <h2 className='headline-dark text-left w-full'>
                        Expanding Across the U.S.
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1} className='w-full'>
                    <div
                        ref={containerRef}
                        className='grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 md:gap-y-20 w-full'>
                        {visibleCities.map((city, idx) => (
                            <div
                                key={`${city.name}-${idx}`}
                                className={`city-item flex flex-col gap-2 md:gap-4 ${idx >= 6 ? 'hidden md:flex' : 'flex'}`}>
                                <h3 className='text-[20px] md:text-[28px] font-semibold md:font-bold leading-[130%] md:leading-[110%] tracking-[-0.02em] text-dark'>
                                    {city.name}
                                </h3>
                                <div className='flex flex-col gap-y-2 text-[16px] md:text-[20px] text-dark leading-[120%]'>
                                    <span>{city.capacity}</span>
                                    <span>{city.stationName}</span>
                                    <span>{city.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeUp>

                <FadeUp delay={0.2} className='relative z-20 w-full md:mb-30'>
                    <WattupButton
                        href='/locations#locations'
                        className='w-full md:w-auto mb-8'>
                        View All Locations
                    </WattupButton>
                </FadeUp>
            </div>
        </div>
    );
}

