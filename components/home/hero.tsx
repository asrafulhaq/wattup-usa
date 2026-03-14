'use client';

import { FadeUp } from '@/components/ui/fade-up';
import { ReusableSlider } from '@/components/ui/reusable-slider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from './navbar';

function HeroContent({ dark }: { dark: boolean }) {
    return (
        <div className=''>
            <div
                className={`relative z-10  container mx-auto flex flex-col items-center text-center  ${dark ? 'text-white' : 'text-dark'}`}>
                <FadeUp yOffset={30}>
                    <h1
                        className={cn(
                            'headline mb-5',
                            dark ? 'text-dark' : 'text-white'
                        )}>
                        Powering the Next <br className='hidden md:block' />
                        Generation of EV Charging
                    </h1>
                </FadeUp>

                <FadeUp delay={0.2} yOffset={20}>
                    <p
                        className={cn(
                            'text-lg md:text-[20px] font-normal max-w-[416px] mx-auto mb-8 leading-[120%]',
                            dark ? 'text-dark' : 'text-white'
                        )}>
                        Fast, reliable charging stations located
                        <br className='hidden sm:block' />
                        where you live, work, and travel.
                    </p>
                </FadeUp>

                <FadeUp
                    delay={0.4}
                    yOffset={20}
                    className='w-full flex-col font-sans'>
                    <div className='flex flex-col sm:flex-row items-center justify-center gap-[10px]'>
                        <Link
                            href='/find-charger'
                            className='w-full sm:w-[210px] flex items-center justify-center px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-medium text-[16px] leading-[130%] tracking-[-0.03em] transition-transform hover:-translate-y-0.5 shadow-btn whitespace-nowrap'>
                            Find a Charger
                        </Link>
                        <Link
                            href='/partner'
                            className='w-full sm:w-[210px] flex items-center justify-center px-[28px] py-[16px] bg-white text-dark hover:bg-gray-light rounded-[8px] font-medium text-[16px] leading-[130%] tracking-[-0.03em] transition-transform hover:-translate-y-0.5 shadow-btn whitespace-nowrap'>
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
            <div className='relative w-full h-full flex flex-col items-center justify-start pt-[116px]'>
                {/* Background Image Setup */}
                <div className='absolute inset-0 z-0 select-none'>
                    <Image
                        src='/assets/images/hero-1.png'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover object-center brightness-75'
                        priority
                        draggable={false}
                    />
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
            <div className='relative w-full h-full flex flex-col items-center justify-start pt-[116px]'>
                {/* Background Image Setup */}
                <div className='absolute inset-0 z-0 select-none'>
                    <Image
                        src='/assets/images/hero-2.jpg'
                        alt='WattUp Hero Station'
                        fill
                        className='object-cover object-center brightness-75'
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
        <section className='relative  overflow-x-hidden mx-auto w-full h-[100dvh] lg:h-auto lg:aspect-[1440/951] max-h-[951px] overflow-hidden'>
            {/* The Navbar floats absolutely over the entire Hero */}
            <Navbar />

            <ReusableSlider slides={slidesData} className='w-full h-full' />
        </section>
    );
}

