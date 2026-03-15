import { TechnologySlideData } from '@/data';
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
            className={`absolute inset-0 w-full h-[756px] will-change-transform ${slide.className || ''}`}
            style={style}>
            {/* Image */}
            <div className='absolute inset-0 z-0'>
                <Image
                    src={slide.image}
                    alt={slide.title.replace('\n', ' ')}
                    fill
                    className={
                        slide.imageClassName || 'object-cover object-bottom'
                    }
                    sizes='1440px'
                    priority={slide.number === '01.'}
                />
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
                    className='absolute z-[5] pointer-events-none'
                    style={slide.gradientStyle}
                />
            )}

            {/* Text overlay container */}
            <div
                className={`absolute z-10 w-full pointer-events-none ${
                    slide.textStyle
                        ? '' // Don't apply default positioning if exact style is provided
                        : `top-0 bottom-0 md:max-w-[440px] flex flex-col justify-center ${
                              slide.textPosition === 'left'
                                  ? 'left-[40px] lg:left-[100px]'
                                  : 'right-[40px] lg:right-[100px]'
                          }`
                }`}
                style={slide.textStyle}>
                <div
                    ref={textRef}
                    className='relative flex flex-col gap-[8px] will-change-transform pointer-events-auto'>
                    <h3 className='headline-3 text-white whitespace-pre-line'>
                        <span className='text-white/70 mr-[12px]'>
                            {slide.number}
                        </span>
                        {slide.title}
                    </h3>
                    <p className='text-description text-white/50 md:max-w-[284px]'>
                        {slide.description}
                    </p>
                </div>
            </div>
        </div>
    );
});
TechnologyBackedSlide.displayName = 'TechnologyBackedSlide';

