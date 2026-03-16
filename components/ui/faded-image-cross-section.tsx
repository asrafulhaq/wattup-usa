import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';

export interface FadedImageCrossSectionProps {
    children: React.ReactNode;
    imageSrc: string;
    imageAlt?: string;
    bottomGradient?: boolean;
    topFaddingStyle?: React.CSSProperties;
    sectionClass?: string;
}

export function FadedImageCrossSection({
    children,
    imageSrc,
    imageAlt = 'Section background',
    bottomGradient = true,
    topFaddingStyle = {
        background:
            'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 50%)',
    },
    sectionClass,
}: FadedImageCrossSectionProps) {
    return (
        <section
            className={`relative w-full overflow-hidden flex flex-col items-center bg-white ${sectionClass}`}>
            {/* Top Section: Content (e.g. Marquee, Text, etc) */}
            <div className='relative z-10 w-full flex flex-col items-center justify-start '>
                {children}
            </div>

            {/* Bottom Section: Image exactly as Figma */}
            <div
                className={cn(
                    'relative w-full max-md:h-[744px] h-[995px] xl:h-[1080px] z-0 -mt-[238px] shrink-0 overflow-hidden',
                    sectionClass
                )}>
                {/* 1. Base Image */}
                <div className='image'>
                    {' '}
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className='object-cover '
                        sizes='1440px'
                        priority
                    />
                </div>

                {/* 2. Top-down White Gradient (180deg from White 0% to White 0% -> translates to a fade from white down) 
                     Based on Figma: Linear Gradient White -> White/0 */}
                <div
                    className='absolute inset-0 pointer-events-none'
                    style={topFaddingStyle}
                />

                {/* 3. Bottom-up White Gradient (180deg White 0% to White 87% to White)
                     Based on Figma: Linear Gradient fading out the bottom */}

                {bottomGradient && (
                    <div
                        className='absolute inset-0 pointer-events-none bg-linear-to-t from-white via-white/80 to-transparent'
                        style={{
                            // Keep md-specific height constraints for the gradient
                            backgroundImage:
                                'linear-gradient(0deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 35%)',
                        }}>
                        {/* We use a max-md specific override to blend the bottom 50% correctly 
                            since the image is 486px and container is 686px */}
                        <div
                            className='absolute md:hidden inset-0 bg-linear-to-t from-white via-white/90 to-transparent pointer-events-none'
                            style={{
                                backgroundImage:
                                    'linear-gradient(to top, #FFFFFF 25%, rgba(255, 255, 255, 0) 35%)',
                            }}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

