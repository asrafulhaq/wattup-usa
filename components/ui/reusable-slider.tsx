'use client';

import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import * as React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/icons';

export interface SlideData {
    id: string | number;
    content: React.ReactNode;
}

export interface ReusableSliderProps {
    slides: SlideData[];
    className?: string;
    slideClassName?: string;
    showArrows?: boolean;
    showDots?: boolean;
}

export function ReusableSlider({
    slides,
    className,
    slideClassName,
    showArrows = true,
    showDots = true,
}: ReusableSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
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

    return (
        <div className={cn('relative', className)}>
            <div className='overflow-hidden h-full' ref={emblaRef}>
                <div className='flex h-full -ml-4'>
                    {slides.map(slide => (
                        <div
                            key={slide.id}
                            className={cn(
                                'min-w-0 shrink-0 grow-0 basis-full pl-4 relative h-full',
                                slideClassName
                            )}>
                            {slide.content}
                        </div>
                    ))}
                </div>
            </div>

            {showArrows && (
                <div className='absolute hidden md:block top-1/2 -translate-y-1/2 left-0 right-0 z-20 pointer-events-none'>
                    <div className='container mx-auto flex justify-between'>
                        <button
                            className='pointer-events-auto flex h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-[#f1f1f1]/50 hover:bg-[#f1f1f1]/80 backdrop-blur-md transition-all shadow-[0px_27px_11px_rgba(0,0,0,0.01),0px_15px_9px_rgba(0,0,0,0.02),0px_7px_7px_rgba(0,0,0,0.05),0px_2px_4px_rgba(0,0,0,0.04)] text-[#2d2d2d]'
                            onClick={scrollPrev}
                            aria-label='Previous slide'>
                            <ArrowLeftIcon />
                        </button>
                        <button
                            className='pointer-events-auto flex h-[48px] w-[48px] items-center justify-center rounded-[4px] bg-[#f1f1f1]/50 hover:bg-[#f1f1f1]/80 backdrop-blur-md transition-all shadow-[0px_27px_11px_rgba(0,0,0,0.01),0px_15px_9px_rgba(0,0,0,0.02),0px_7px_7px_rgba(0,0,0,0.05),0px_2px_4px_rgba(0,0,0,0.04)] text-[#2d2d2d]'
                            onClick={scrollNext}
                            aria-label='Next slide'>
                            <ArrowRightIcon />
                        </button>
                    </div>
                </div>
            )}

            {showDots && (
                <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-[10px] items-center'>
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                'h-[16px] w-[16px] rounded-full transition-all duration-300',
                                index === selectedIndex
                                    ? 'bg-[#393939] scale-110 shadow-[0_0_0_1px_rgba(255,255,255,0.4)]'
                                    : 'bg-[#2d2d2d]/40 hover:bg-[#2d2d2d]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
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

