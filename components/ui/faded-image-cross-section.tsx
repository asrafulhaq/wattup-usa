import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';
import { FadeUp } from './fade-up';

export interface FadedImageCrossSectionProps {
    /** Omit to render the image band on its own, with no content above it. */
    children?: React.ReactNode;
    imageSrc: string;
    imageSrcMobile?: string;
    imageClass?: string;
    imageAlt?: string;
    topFaddingStyle?: React.CSSProperties;
    sectionClass?: string;
    /**
     * Overrides the image wrapper, whose default pulls the image up under the content
     * above it. Pass a wrapper without that negative margin when the band stands alone.
     */
    imageWrapperClass?: string;
}

export function FadedImageCrossSection({
    children,
    imageSrc,
    imageSrcMobile,
    imageClass,
    imageAlt = 'Section background',
    imageWrapperClass,
}: FadedImageCrossSectionProps) {
    return (
        <section
            className={`relative w-full overflow-hidden flex flex-col items-center bg-white `}>
            {/* Top Section: Content (e.g. Marquee, Text, etc) */}
            {children && (
                <div className='relative z-10 w-full flex flex-col items-center justify-start '>
                    {children}
                </div>
            )}

            {/* Bottom Section: Image exactly as Figma */}

            <FadeUp delay={0.3} className='w-full'>
                <div
                    className={cn(
                        imageWrapperClass ??
                            'relative -mt-30 sm:-mt-96 w-full h-[600px] xs:h-[790px] sm:h-[990px] md:h-[1280px] 3xl:h-[1450px]! ultra:h-[1750px]!'
                    )}>
                    {/* Mobile image — shown only below md */}
                    {imageSrcMobile && (
                        <Image
                            src={imageSrcMobile}
                            alt={imageAlt}
                            fill
                            className='object-cover sm:hidden'
                            sizes='100vw'
                            priority
                            draggable={false}
                        />
                    )}
                    {/* Desktop image — full bleed at all sizes, contain only at xl */}
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className={cn(
                            'object-cover',
                            imageSrcMobile ? 'hidden sm:block' : 'block'
                        )}
                        sizes='100vw'
                        priority
                        draggable={false}
                    />
                </div>
            </FadeUp>
        </section>
    );
}

