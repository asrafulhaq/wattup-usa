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
    /** Number of slides visible per view on desktop. Default: 2 */
    slidesPerView?: number;
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
    gap = 20,
    showArrows = true,
    showDots = true,
    loop = true,
}: CardSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop,
        align: 'start',
        slidesToScroll: slidesPerView,
        containScroll: 'trimSnaps',
    });

    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

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

    // Calculate basis based on slidesPerView and gap
    const basisStyle = `calc((100% - ${(slidesPerView - 1) * gap}px) / ${slidesPerView})`;

    return (
        <div className={cn('relative', className)}>
            <div
                className='overflow-visible [clip-path:inset(-100vh_-100vw_-100vh_0)]'
                ref={emblaRef}>
                <div className='flex' style={{ marginLeft: `-${gap}px` }}>
                    {slides.map(slide => (
                        <div
                            key={slide.id}
                            className={cn(
                                'min-w-0 shrink-0 grow-0 relative',
                                slideClassName
                            )}
                            style={{
                                flexBasis: basisStyle,
                                paddingLeft: `${gap}px`,
                            }}>
                            {slide.content}
                        </div>
                    ))}
                </div>
            </div>

            {/* Arrows — positioned relative to the slider viewport */}
            {showArrows && (
                <>
                    <button
                        className='absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-[#f1f1f1]/50 hover:bg-[#f1f1f1]/80 backdrop-blur-md transition-all shadow-btn text-dark'
                        onClick={scrollPrev}
                        aria-label='Previous slide'>
                        <ArrowLeftIcon />
                    </button>
                    <button
                        className='absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 flex h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-[#f1f1f1]/50 hover:bg-[#f1f1f1]/80 backdrop-blur-md transition-all shadow-btn text-dark'
                        onClick={scrollNext}
                        aria-label='Next slide'>
                        <ArrowRightIcon />
                    </button>
                </>
            )}

            {/* Dots — below the slider */}
            {showDots && (
                <div className='flex gap-[10px] items-center mt-8'>
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                'h-[10px] w-[10px] rounded-full transition-all duration-300',
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

