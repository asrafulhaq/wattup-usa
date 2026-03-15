'use client';

import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import * as React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/icons';

export interface CardSlideData {
    id: string | number;
    content: React.ReactNode;
}

export interface CardSliderProps {
    slides: CardSlideData[];
    className?: string;
    slideClassName?: string;
    /** Number of slides visible per view on all sizes. Overridden by mobilePerView/desktopPerView if provided. Default: 2 */
    slidesPerView?: number | 'auto';
    /** Slides per view on mobile (< md). Defaults to slidesPerView. */
    mobilePerView?: number;
    /** Slides per view on desktop (≥ md). Defaults to slidesPerView. */
    desktopPerView?: number;
    /** Gap between slides in px. Default: 20 */
    gap?: number;
    showArrows?: boolean;
    showDots?: boolean;
    loop?: boolean;
}

export function CardSlider({
    slides,
    className,
    slideClassName,
    slidesPerView = 2,
    mobilePerView,
    desktopPerView,
    gap = 20,
    showArrows = true,
    showDots = true,
    loop = true,
}: CardSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop,
        align: 'start',
        slidesToScroll: 1,
    });

    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
    const [isMobile, setIsMobile] = React.useState(false);

    // Track viewport for responsive slides per view
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const scrollPrev = React.useCallback(
        () => emblaApi && emblaApi.scrollPrev(),
        [emblaApi]
    );
    const scrollNext = React.useCallback(
        () => emblaApi && emblaApi.scrollNext(),
        [emblaApi]
    );
    const scrollTo = React.useCallback(
        (index: number) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi]
    );

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    React.useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);

        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    // Resolve active slides per view
    const activeSlidesPerView = React.useMemo(() => {
        if (isMobile && mobilePerView != null) return mobilePerView;
        if (!isMobile && desktopPerView != null) return desktopPerView;
        return slidesPerView;
    }, [isMobile, mobilePerView, desktopPerView, slidesPerView]);

    const basisStyle =
        activeSlidesPerView === 'auto'
            ? 'auto'
            : `calc((100% - ${(typeof activeSlidesPerView === 'number' ? Math.floor(activeSlidesPerView) - 1 : 0) * gap}px) / ${activeSlidesPerView})`;

    return (
        <div className={cn('', className)}>
            {/* Wrapper for viewport + arrows so arrows center on cards only */}
            <div className='relative'>
                <div
                    className='overflow-visible [clip-path:inset(-100vh_-100vw_-100vh_0)]'
                    ref={emblaRef}>
                    <div className='flex' style={{ marginLeft: `-${gap}px` }}>
                        {slides.map(slide => (
                            <div
                                key={slide.id}
                                className={cn('', slideClassName)}
                                style={{
                                    flex: `0 0 ${basisStyle}`,
                                    minWidth: 0,
                                    paddingLeft: `${gap}px`,
                                }}>
                                {slide.content}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Arrows — hidden on mobile per Figma, visible on desktop */}
                {showArrows && (
                    <>
                        <button
                            className='hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-background/30 hover:bg-background/50 backdrop-blur-md transition-all shadow-btn text-dark'
                            onClick={scrollPrev}
                            aria-label='Previous slide'>
                            <ArrowLeftIcon />
                        </button>
                        <button
                            className='hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-background/30 hover:bg-background/50 backdrop-blur-md transition-all shadow-btn text-dark'
                            onClick={scrollNext}
                            aria-label='Next slide'>
                            <ArrowRightIcon />
                        </button>
                    </>
                )}
            </div>

            {/* Dots — below the slider */}
            {showDots && (
                <div className='flex gap-[10px] items-center max-md:justify-center mt-8'>
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                'h-[16px] w-[16px] rounded-full transition-all duration-300',
                                index === selectedIndex
                                    ? 'bg-dark scale-110'
                                    : 'bg-gray hover:bg-dark/60'
                            )}
                            onClick={() => scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

