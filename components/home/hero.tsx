'use client';

import { FadeUp } from '@/components/ui/fade-up';
import { ReusableSlider } from '@/components/ui/reusable-slider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

function HeroContent({ dark }: { dark: boolean }) {
    return (
        <div className='pt-[99px] md:pt-[116px]'>
            <div
                className={`relative z-10  container mx-auto flex flex-col items-center text-center  ${dark ? 'text-white' : 'text-dark'}`}>
                <FadeUp yOffset={30}>
                    <h1
                        className={cn(
                            'headline max-sm:h-[105px] w-[348px] md:w-[642px] mb-4 md:mb-5',
                            dark ? 'text-dark' : 'text-white'
                        )}>
                        Powering the Next <br className='hidden md:block' />
                        Generation of EV Charging
                    </h1>
                </FadeUp>

                <FadeUp delay={0.2} yOffset={20}>
                    <p
                        className={cn(
                            'text-[16px] md:text-[20px] font-normal max-w-[416px] mx-auto mb-6 md:mb-8 leading-[120%]',
                            dark ? 'text-dark' : 'text-white'
                        )}>
                        Fast, reliable charging stations located
                        <br className='hidden md:block' />
                        where you live, work, and travel.
                    </p>
                </FadeUp>

                <FadeUp
                    delay={0.4}
                    yOffset={20}
                    className='w-full flex-col font-sans'>
                    <div className='flex flex-row items-center justify-center gap-[16px]'>
                        <Link
                            href='/find-charger'
                            className='w-full md:w-[210px] flex items-center justify-center px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] leading-[130%] tracking-[-0.03em] transition-colors duration-500 shadow-btn whitespace-nowrap'>
                            Find a Charger
                        </Link>
                        <Link
                            href='/partner'
                            className='w-full md:w-[210px] flex items-center justify-center px-[28px] py-[16px] bg-white text-dark hover:bg-gray-light rounded-[8px] font-bold text-[16px] leading-[130%] tracking-[-0.03em] transition-colors duration-500  shadow-btn whitespace-nowrap'>
                            Partner With Us
                        </Link>
                    </div>
                </FadeUp>
            </div>
        </div>
    );
}

const slidesData = [
    {
        id: 1,
        content: (
            <div className='relative w-full h-full flex flex-col items-center justify-start'>
                {/* Background Image Setup */}
                <div className='absolute inset-0 z-0 select-none bg-[#032e4d]'>
                    <Image
                        src='/assets/images/hero-1-md.png'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover hidden md:block object-center'
                        priority
                        draggable={false}
                    />
                    <Image
                        src='/assets/images/hero-1.png'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover md:hidden object-center'
                        priority
                        draggable={false}
                    />
                    {/* Seamless fade for mobile to reduce zoom while covering top sky */}

                    {/* Subtle Gradient Overlay for Text Readability */}
                    <div className='absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent' />
                </div>

                {/* Content Container */}
                <HeroContent dark={false} />
            </div>
        ),
    },
    {
        id: 2,
        content: (
            <div className='relative w-full h-full flex flex-col items-center justify-start'>
                {/* Background Image Setup */}
                <div className='absolute inset-0 z-0 select-none bg-[#cfd8e3]'>
                    <Image
                        src='/assets/images/hero-2-md.png'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover hidden md:block object-bottom'
                        priority
                        draggable={false}
                    />
                    <Image
                        src='/assets/images/hero-2.png'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover md:hidden object-bottom'
                        priority
                        draggable={false}
                    />

                    {/* Subtle Gradient Overlay for Text Readability */}
                    <div className='absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent' />
                </div>

                {/* Content Container */}
                <HeroContent dark={true} />
            </div>
        ),
    },
];

export function Hero() {
    return (
        <section className='relative  overflow-x-hidden mx-auto w-full  md:aspect-1440/951 h-[744px] md:h-[961px] xl:h-[1080px] overflow-hidden'>
            <ReusableSlider slides={slidesData} className='w-full h-full' />
        </section>
    );
}

