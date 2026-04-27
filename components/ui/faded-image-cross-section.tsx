import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';

export interface FadedImageCrossSectionProps {
    children: React.ReactNode;
    imageSrc: string;
    imageSrcMobile?: string;
    imageAlt?: string;
    topFaddingStyle?: React.CSSProperties;
    sectionClass?: string;
}

export function FadedImageCrossSection({
    children,
    imageSrc,
    imageSrcMobile,
    imageAlt = 'Section background',
    topFaddingStyle = {
        background:
            'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 50%)',
    },
    sectionClass,
}: FadedImageCrossSectionProps) {
    return (
        <section
            className={`relative w-full overflow-hidden flex flex-col items-center bg-white `}>
            {/* Top Section: Content (e.g. Marquee, Text, etc) */}
            <div className='relative z-10 w-full flex flex-col items-center justify-start '>
                {children}
            </div>

            {/* Bottom Section: Image exactly as Figma */}
            <div
                className={cn(
                    'relative w-full max-md:h-[744px] h-[895px] xl:h-[1080px] z-0 -mt-[300px] max-md:-mb-[100px] md:-mt-[365px] shrink-0',
                    sectionClass
                )}>
                {/* 1. Base Image */}
                <div className='image '>
                    {' '}
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className={cn(
                            'object-cover',
                            imageSrcMobile && 'sm:block hidden'
                        )}
                        sizes='1440px'
                        priority
                    />
                    {imageSrcMobile && (
                        <Image
                            src={imageSrcMobile}
                            alt={imageAlt}
                            fill
                            className='object-contain sm:hidden block'
                            sizes='380px'
                        />
                    )}
                </div>

                {/* 2. Top-down White Gradient (180deg from White 0% to White 0% -> translates to a fade from white down) 
                     Based on Figma: Linear Gradient White -> White/0 */}
                <div
                    className='absolute inset-0 pointer-events-none'
                    style={topFaddingStyle}
                />

                {/* 3. Bottom-up White Gradient (180deg White 0% to White 87% to White)
                     Based on Figma: Linear Gradient fading out the bottom */}

                {/*          {bottomGradient && (
                    <div
                        className='absolute bottom-0 left-0 right-0 pointer-events-none'
                        style={{
                            // Height covers the visible fade zone. Pure white extends to 35%
                            // (~172px at 895px height) which exceeds the -mb-40 (160px) overlap,
                            // ensuring the next section always lands on fully-opaque white.
                            height: '35%',
                            backgroundImage:
                                'linear-gradient(to top, #FFFFFF 0%, #FFFFFF 45%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,0) 100%)',
                        }}
                    />
                )} */}
            </div>
        </section>
    );
}

