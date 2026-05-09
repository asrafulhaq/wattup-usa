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
            className={cn(
                'absolute inset-0 w-full will-change-transform',
                'max-md:flex max-md:flex-col',
                slide.className
            )}
            style={style}>
            {/* Mobile text — top section in normal flow, above image */}
            <div
                ref={textRef}
                className='md:hidden flex-shrink-0 px-4 pt-8 pb-5'>
                <div className='flex items-start gap-2'>
                    <span className='text-white/70 text-[24px] font-medium leading-[110%] shrink-0'>
                        {slide.number}
                    </span>
                    <div className='flex flex-col gap-3'>
                        <h3 className='text-[24px] text-white font-medium leading-[110%]'>
                            {slide.title.replace('\n', ' ')}
                        </h3>
                        <p className='text-[16px] text-white/50 leading-[140%]'>
                            {slide.description.replace('\n', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Image area — desktop: absolute inset; mobile: flex-1 below text */}
            <div className='md:absolute md:inset-0 max-md:relative max-md:flex-1 max-md:overflow-hidden z-0'>
                {/* Desktop image */}
                <Image
                    src={slide.image}
                    alt={slide.title.replace('\n', ' ')}
                    fill
                    className={cn(
                        'object-cover object-bottom',
                        slide.imageClassName,
                        slide.mobileImage && 'hidden md:block',
                        slide.number === '02.' && 'max-lg:object-right max-xl:-ml-60'
                    )}
                    sizes='(max-width: 768px) 100vw, 1440px'
                    priority={slide.number === '01.'}
                />

                {/* Mobile image */}
                {slide.mobileImage && (
                    <Image
                        src={slide.mobileImage}
                        alt={slide.title.replace('\n', ' ')}
                        fill
                        className={cn(
                            'object-cover object-top',
                            slide.imageClassName,
                            'md:hidden'
                        )}
                        priority={slide.number === '01.'}
                    />
                )}

                {/* Vignette — desktop only */}
                <div
                    className='absolute max-md:hidden inset-0 z-1 pointer-events-none'
                    style={{
                        boxShadow: 'inset 0 0 150px 60px rgba(0, 0, 0, 0.95)',
                    }}
                />

                {/* Desktop gradient */}
                {slide.gradientStyle && (
                    <div
                        className='absolute z-5 pointer-events-none hidden md:block'
                        style={slide.gradientStyle}
                    />
                )}

                {/* Mobile gradient */}
                {slide.mobileGradientStyle && (
                    <div
                        className='absolute z-5 pointer-events-none md:hidden'
                        style={slide.mobileGradientStyle}
                    />
                )}

                {/* Desktop text overlay — absolutely positioned */}
                <div
                    className={cn(
                        'hidden md:block absolute z-10 w-full pointer-events-none',
                        slide.number === '02.' && 'max-xl:-ml-60'
                    )}>
                    <div
                        className='absolute pointer-events-auto'
                        style={slide.textStyle}>
                        <div className='flex flex-col gap-2 items-start text-left'>
                            <h3 className='headline-3 text-white whitespace-pre-line'>
                                <span className='text-white/70 mr-3'>
                                    {slide.number}
                                </span>
                                {slide.title}
                            </h3>
                            <p className='text-description text-white/50 max-w-[284px]'>
                                {slide.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
TechnologyBackedSlide.displayName = 'TechnologyBackedSlide';
