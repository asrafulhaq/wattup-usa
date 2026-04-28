'use client';

import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import { homeImageUrls } from '@/lib/images/home';
import { WattupButton } from '@/components/ui/wattup-button';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { cities } from '@/data';
import { cn } from '@/lib/utils';

export function ExpandingUsDrivers({
    isLocationsPage = false,
}: {
    isLocationsPage?: boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (showAll) {
                // Target cities from index 9 onwards (8 items visible initially)
                const newCities = containerRef.current?.querySelectorAll(
                    '.city-item:nth-child(n+9)'
                );
                if (newCities && newCities.length > 0) {
                    gsap.from(newCities, {
                        opacity: 0,
                        y: 30,
                        stagger: 0.04,
                        duration: 0.6,
                        ease: 'power2.out',
                        clearProps: 'all',
                    });
                }
            }
        },
        { dependencies: [showAll], scope: containerRef }
    );

    // Always show 8 initially, unless showAll is true on the locations page
    const visibleCities =
        isLocationsPage && showAll ? cities : cities.slice(0, 8);
    return (
        <div id='locations' className='pt-[40px] md:pt-[82px]'>
            <FadedImageCrossSection
                imageSrc={homeImageUrls.locationMarqueBg}
                imageSrcMobile={homeImageUrls.locationMarqueBgMobile}
                imageAlt='Charging Stations By Water'
                >
                <div className='flex flex-col space-y-[32px] md:space-y-20 w-full max-w-[1440px] px-4 md:px-10 mx-auto justify-start'>
                    <FadeUp>
                        <h2 className='headline-dark max-md:w-[305px] text-left w-full'>
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
                                    className='city-item flex flex-col gap-2 md:gap-4'>
                                    <h3 className='text-[20px] md:text-[28px] font-semibold md:font-bold leading-[130%] md:leading-[110%] tracking-[-0.02em] text-dark'>
                                        {city.name}
                                    </h3>
                                    <div className='flex flex-col gap-y-2 text-[16px] md:text-[20px] text-dark leading-[120%]'>
                                        <span>{city.capacity}</span>
                                        <span>{city.stationName}</span>
                                        <Link
                                            href={`tel:${city.contact.replace(/[^\d+]/g, '')}`}
                                            className='w-fit underline decoration-1 underline-offset-4 decoration-dark hover:text-dark/70 transition-colors'>
                                            {city.contact}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.2} className='relative z-20 w-full mb-30'>
                        {isLocationsPage ? (
                            cities.length > 8 &&
                            !showAll && (
                                <WattupButton
                                    onClick={() => setShowAll(true)}
                                    className='w-full md:w-auto mb-8'>
                                    See More Locations
                                </WattupButton>
                            )
                        ) : (
                            <WattupButton
                                href='/locations#locations'
                                className='w-full md:w-auto mb-8'>
                                View All Locations
                            </WattupButton>
                        )}
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

