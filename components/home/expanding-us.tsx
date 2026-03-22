import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import Link from 'next/link';

const cities = [
    'Los Angeles',
    'San Diego',
    'San Jose',
    'San Francisco',
    'Phoenix',
];

export function ExpandingUs() {
    return (
        <div id='who-we-serve' className='pt-[40px] md:pt-[82px]'>
            <FadedImageCrossSection
                imageSrc='/assets/images/location-marque-bg.png'
                imageAlt='Charging Stations By Water'
                sectionClass='max-md:-mb-22'>
                <div className='flex flex-col space-y-[32px] md:space-y-20  items-center text-center w-full'>
                    <FadeUp>
                        <h2 className='headline-dark max-sm:w-[348px]'>
                            Expanding Across the U.S.
                        </h2>
                    </FadeUp>

                    <FadeUp
                        delay={0.1}
                        className='w-full overflow-hidden relative'>
                        <div className='flex max-w-[1444px] mx-auto whitespace-nowrap overflow-hidden group w-full relative'>
                            <div className='flex w-max animate-marquee group-hover:paused'>
                                {/* Duplicate array for seamless infinite scrolling */}
                                {[...cities, ...cities].map((city, idx) => (
                                    <div
                                        key={idx}
                                        className='flex items-center text-[40px] md:text-[64px] font-bold leading-[110%] tracking-[-3%]'>
                                        <span className='text-gray/36 hover:text-dark transition-colors duration-500 cursor-pointer '>
                                            {city}
                                        </span>
                                        {/* Dot separator */}
                                        <span className='text-gray/30 px-4 md:px-8 pointer-events-none rounded-none select-none '>
                                            ·
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.2} className='relative z-20 mb-30'>
                        <Link
                            href='#'
                            className='inline-flex justify-center max-md:w-[348px] max-md:mx-auto px-[28px] py-4 bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] transition-colors duration-500 mb-8'>
                            View All Locations
                        </Link>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

