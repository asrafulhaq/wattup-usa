import { TechnologySlideData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { forwardRef } from 'react';

interface TechnologyBackedSlideProps {
    slide: TechnologySlideData;
    textRef: React.Ref<HTMLDivElement>;
    style?: React.CSSProperties;
}

export const TechnologyBackedSlide = forwardRef<
    HTMLDivElement,
    TechnologyBackedSlideProps
>(({ slide, textRef, style }, ref) => {
    return (
        <div
            ref={ref}
            className={`absolute inset-0 w-full h-[600px] md:h-[756px] will-change-transform ${slide.className || ''}`}
            style={style}>
            {/* Image */}
            <div className='absolute inset-0 z-0'>
                <Image
                    src={slide.image}
                    alt={slide.title.replace('\n', ' ')}
                    fill
                    className={cn(
                        'object-cover object-bottom max-md:object-[60%_bottom]',
                        slide.imageClassName,
                        slide?.mobileImage && 'hidden md:block',
                        slide.number === '02.' &&
                            'max-lg:object-right max-xl:-ml-60'
                    )}
                    /*    sizes='(max-width: 768px) 100vw, 1440px' */
                    priority={slide.number === '01.'}
                />

                {slide.mobileImage && (
                    <Image
                        src={slide.mobileImage}
                        alt={slide.title.replace('\n', ' ')}
                        fill
                        className={cn(
                            'object-cover max-md:object-[70%_bottom]',
                            slide.imageClassName,
                            slide?.mobileImage && 'md:hidden',
                            slide.number === '03.' && 'max-md:mt-[230px]',
                            slide.number === '02.' && 'max-sm:ml-0 sm:-ml-20'
                        )}
                        /*    sizes='(max-width: 768px) 100vw, 1440px' */
                        priority={slide.number === '01.'}
                    />
                )}
            </div>

            {/* Vignette — dark edges that blend corners into black background */}
            <div
                className='absolute inset-0 z-1 pointer-events-none'
                style={{
                    boxShadow: 'inset 0 0 150px 60px rgba(0, 0, 0, 0.95)',
                }}
            />

            {/* Slide-level Custom Gradient (placed after image, before text) */}
            {slide.gradientStyle && (
                <div
                    className='absolute z-5 pointer-events-none md:block hidden'
                    style={slide.gradientStyle}
                />
            )}

            {/* Text overlay container */}
            <div
                ref={textRef}
                className={cn(
                    `absolute z-10 w-full pointer-events-none ${
                        slide.textStyle
                            ? 'max-md:top-14 max-md:left-0' // Reset absolute on mobile
                            : `top-0 bottom-0 md:max-w-[440px] flex flex-col justify-center ${
                                  slide.textPosition === 'left'
                                      ? 'left-[40px] lg:left-[100px]'
                                      : 'right-[40px] lg:right-[100px]'
                              }`
                    }`,
                    slide?.number === '02.' &&
                        'max-lg:text-left max-sm:ml-0 max-xl:-ml-60'
                )}>
                {/* Desktop Absolute Positioning Wrapper */}
                <div
                    className='hidden md:block absolute'
                    style={slide.textStyle}>
                    <div className='flex flex-col gap-[8px] pointer-events-auto items-start text-left'>
                        <h3 className='headline-3 text-white whitespace-pre-line'>
                            <span className='text-white/70 mr-[12px]'>
                                {slide.number}
                            </span>
                            {slide.title}
                        </h3>
                        <p className='text-description text-white/50 max-w-[284px]'>
                            {slide.description}
                        </p>
                    </div>
                </div>

                {/* Mobile Version - Alternating Alignment */}
                <div
                    className={`md:hidden flex flex-col pl-4 w-full pointer-events-auto ${
                        slide.textPosition === 'left'
                            ? 'items-start'
                            : 'items-end'
                    } text-left`}>
                    <div className='max-w-[284px] flex flex-col gap-2'>
                        <div className='text-[24px] text-white font-medium leading-[110%] tracking-[-3%] flex'>
                            <span className='text-white/70 mr-[8px]'>
                                {slide.number}
                            </span>
                            <div className='flex flex-col gap-3'>
                                <h3> {slide.title.replace('\n', ' ')}</h3>
                                <p className='text-[16px] text-white/50 font-medium leading-[140%]'>
                                    {slide.description.replace('\n', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
TechnologyBackedSlide.displayName = 'TechnologyBackedSlide';

