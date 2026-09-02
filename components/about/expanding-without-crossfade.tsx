'use client';

import { FadeUp } from '@/components/ui/fade-up';
import { WattupButton } from '@/components/ui/wattup-button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import type { NetworkCity } from '@/lib/locations/network';

export function ExpandingWithoutCrossfade({
    /** Read from the database on the server. See lib/locations/network.ts. */
    cities,
}: {
    cities: NetworkCity[];
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Eight, with the last two hidden below md. The full network is on /locations.
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
                            <Link
                                key={`${city.name}-${city.region}`}
                                href={city.href}
                                aria-label={
                                    city.siteCount === 1
                                        ? `${city.name}, ${city.county}: ${city.detail}, ${city.status}`
                                        : `${city.name}: ${city.siteCount} locations`
                                }
                                className={`city-item group flex flex-col gap-2 md:gap-4 ${idx >= 6 ? 'hidden md:flex' : 'flex'}`}>
                                <h3 className='flex items-center gap-1.5 text-[20px] md:text-[28px] font-semibold md:font-bold leading-[130%] md:leading-[110%] tracking-[-0.02em] text-dark transition-colors group-hover:text-primary'>
                                    {city.name}
                                    <ArrowUpRight className='size-4 shrink-0 opacity-0 transition-all duration-200 md:size-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100' />
                                </h3>
                                <div className='flex flex-col gap-y-2 text-[16px] md:text-[20px] text-dark leading-[120%]'>
                                    {city.county && (
                                        <span className='text-dark/60'>
                                            {city.county}
                                        </span>
                                    )}
                                    <span>{city.capacity}</span>
                                    <span>{city.detail}</span>
                                    <span>{city.status}</span>
                                </div>
                            </Link>
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

