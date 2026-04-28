import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import { marqueeCities } from '@/data';
import { homeImageUrls } from '@/lib/images/home';
import { WattupButton } from '@/components/ui/wattup-button';

export function ExpandingUs() {
    return (
        <div id='locations' className='pt-10 md:pt-20.5'>
            <FadedImageCrossSection
                imageSrc={homeImageUrls.locationMarqueBg}
                imageSrcMobile={homeImageUrls.locationMarqueBgMobile}
                imageAlt='Charging Stations By Water'
                sectionClass=''>
                <div className='flex flex-col space-y-8 md:space-y-20  items-center text-center w-full'>
                    <FadeUp>
                        <h2 className='headline-dark max-sm:w-87'>
                            Expanding Across the U.S.
                        </h2>
                    </FadeUp>

                    <FadeUp
                        delay={0.1}
                        className='w-full overflow-x-hidden relative'>
                        <div className='flex w-full whitespace-nowrap group relative pb-2'>
                            <div className='flex w-max animate-marquee  group-hover:paused'>
                                {/* Duplicate array for seamless infinite scrolling */}
                                {[...marqueeCities, ...marqueeCities].map(
                                    (city, idx) => (
                                        <div
                                            key={idx}
                                            className='flex items-center text-[40px] md:text-[64px] font-bold leading-[110%]  tracking-[-3%]'>
                                            <span className='text-gray/36 hover:text-dark transition-colors  duration-500 cursor-pointer '>
                                                {city?.name}
                                            </span>
                                            {/* Dot separator */}
                                            <span className='text-gray/30 px-4 md:px-8 pointer-events-none rounded-none select-none '>
                                                ·
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.2} className='relative z-20 mb-30'>
                        <WattupButton
                            href='#'
                            className='max-md:w-87 max-md:mx-auto mb-8'>
                            View All Locations
                        </WattupButton>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

