import Image from 'next/image';
import React from 'react';

export interface FadedImageCrossSectionProps {
    children: React.ReactNode;
    imageSrc: string;
    imageAlt?: string;
}

export function FadedImageCrossSection({
    children,
    imageSrc,
    imageAlt = 'Section background',
}: FadedImageCrossSectionProps) {
    return (
        <section className='relative w-full overflow-hidden flex flex-col items-center bg-white'>
            {/* Top Section: Content (e.g. Marquee, Text, etc) */}
            <div className='relative z-10 w-full flex flex-col items-center justify-start pt-24 pb-12 mb-20'>
                {children}
            </div>

            {/* Bottom Section: Image exactly as Figma */}
            <div className='relative w-[1440px] h-[995px] z-0 -mt-[238px] shrink-0 overflow-hidden'>
                {/* 1. Base Image */}
                <div className='image'>
                    {' '}
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className='object-cover object-center  '
                        sizes='1440px'
                        priority
                    />
                </div>

                {/* 2. Top-down White Gradient (180deg from White 0% to White 0% -> translates to a fade from white down) 
                     Based on Figma: Linear Gradient White -> White/0 */}
                <div
                    className='absolute inset-0 pointer-events-none'
                    style={{
                        background:
                            'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 50%)',
                    }}
                />

                {/* 3. Bottom-up White Gradient (180deg White 0% to White 87% to White)
                     Based on Figma: Linear Gradient fading out the bottom */}
                <div
                    className='absolute inset-0 pointer-events-none'
                    style={{
                        background:
                            'linear-gradient(0deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 35%)',
                    }}
                />
            </div>
        </section>
    );
}

