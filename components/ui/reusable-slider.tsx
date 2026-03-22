'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons/icons';

// ============================================================
// 🎨 FADE ANIMATION CONFIGURATION
// Modify these values to control the transition behavior.
// ============================================================

// CSS transition duration for the crossfade effect (in milliseconds).
const FADE_DURATION_MS = 800;

// Autoplay interval (in milliseconds).
const AUTOPLAY_DELAY_MS = 8000;

// ============================================================

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
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const autoplayRef = React.useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    const totalSlides = slides.length;

    // Reset autoplay timer whenever the selected index changes.
    const resetAutoplay = React.useCallback(() => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
        autoplayRef.current = setInterval(() => {
            setSelectedIndex(prev => (prev + 1) % totalSlides);
        }, AUTOPLAY_DELAY_MS);
    }, [totalSlides]);

    // Start autoplay on mount.
    React.useEffect(() => {
        resetAutoplay();
        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [resetAutoplay]);

    const scrollPrev = React.useCallback(() => {
        setSelectedIndex(prev => (prev - 1 + totalSlides) % totalSlides);
        resetAutoplay();
    }, [totalSlides, resetAutoplay]);

    const scrollNext = React.useCallback(() => {
        setSelectedIndex(prev => (prev + 1) % totalSlides);
        resetAutoplay();
    }, [totalSlides, resetAutoplay]);

    const scrollTo = React.useCallback(
        (index: number) => {
            setSelectedIndex(index);
            resetAutoplay();
        },
        [resetAutoplay]
    );

    return (
        <div className={cn('relative', className)}>
            {/* Slide stack — all slides are layered on top of each other */}
            <div className='relative h-full w-full'>
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={cn(
                            'absolute inset-0 h-full w-full',
                            slideClassName
                        )}
                        style={{
                            opacity: index === selectedIndex ? 1 : 0,
                            zIndex: index === selectedIndex ? 10 : 0,
                            transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
                            pointerEvents:
                                index === selectedIndex ? 'auto' : 'none',
                        }}>
                        {slide.content}
                    </div>
                ))}
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
                <div className='absolute hidden md:flex bottom-8 left-1/2 -translate-x-1/2 z-20 gap-[10px] items-center'>
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                'h-[16px] w-[16px] rounded-full transition-all duration-500',
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

