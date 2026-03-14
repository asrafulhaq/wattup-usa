'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { technologySlidesData } from './technology-backed';
import {
    TechnologyBackedSlide,
    TechnologySlideData,
} from './technology-backed-slide';

gsap.registerPlugin(ScrollTrigger);

/**
 * Variant: xPercent horizontal slide animation
 * Slides enter from the left and exit to the right with scale + rotation feel.
 * Text fades in/out with opacity only (no y transform to prevent drift).
 */
export function TechnologyBackedXPercent({
    slides = technologySlidesData,
}: {
    slides?: TechnologySlideData[];
}) {
    const sectionRef = useRef<HTMLElement>(null);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const textRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || slides.length === 0) return;

        const ctx = gsap.context(() => {
            // Set initial state: all slides stacked, only first visible
            slideRefs.current.forEach((slide, i) => {
                if (!slide) return;
                if (i === 0) {
                    gsap.set(slide, {
                        xPercent: 0,
                        opacity: 1,
                        scale: 1,
                    });
                } else {
                    gsap.set(slide, {
                        xPercent: -120,
                        opacity: 0,
                        scale: 0.9,
                    });
                }
            });

            textRefs.current.forEach((text, i) => {
                if (!text) return;
                if (i === 0) {
                    gsap.set(text, { opacity: 1 });
                } else {
                    gsap.set(text, { opacity: 0 });
                }
            });

            // Master timeline pinned to section
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: `+=80%`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 2,
                    anticipatePin: 1,
                },
            });

            // --- Hold slide 1 visible ---
            tl.to({}, { duration: 0.15 });

            // --- Transition: Slide 0 → Slide 1 ---
            if (slideRefs.current[1]) {
                tl.to(
                    slideRefs.current[0],
                    {
                        xPercent: 120,
                        opacity: 0,
                        scale: 0.9,
                        duration: 1,
                        ease: 'none',
                    },
                    '>'
                )
                    .to(
                        textRefs.current[0],
                        {
                            opacity: 0,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    )
                    .to(
                        slideRefs.current[1],
                        {
                            xPercent: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    )
                    .to(
                        textRefs.current[1],
                        {
                            opacity: 1,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    );

                // --- Hold slide 2 visible ---
                tl.to({}, { duration: 0.15 });
            }

            // --- Transition: Slide 1 → Slide 2 ---
            if (slideRefs.current[2]) {
                tl.to(
                    slideRefs.current[1],
                    {
                        xPercent: 120,
                        opacity: 0,
                        scale: 0.9,
                        duration: 1,
                        ease: 'none',
                    },
                    '>'
                )
                    .to(
                        textRefs.current[1],
                        {
                            opacity: 0,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    )
                    .to(
                        slideRefs.current[2],
                        {
                            xPercent: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    )
                    .to(
                        textRefs.current[2],
                        {
                            opacity: 1,
                            duration: 1,
                            ease: 'none',
                        },
                        '<'
                    );

                // --- Hold slide 3 visible before unpin ---
                tl.to({}, { duration: 0.5 });
            }
        }, section);

        return () => ctx.revert();
    }, [slides.length]);

    return (
        <section
            ref={sectionRef}
            className='relative common-section-padding z-10 h-[1100px] bg-black overflow-hidden'>
            {/* Inner container capped at 1440px */}
            <div className='relative w-full max-w-[1440px] mx-auto h-full'>
                {/* Header — stays on top */}
                <div className='relative z-30 flex flex-col items-center text-center'>
                    <h2 className='headline-white mb-4'>
                        Technology Backed
                        <br />
                        by Global Innovation
                    </h2>
                    <p className='text-description text-white/60 max-w-[534px] mb-[54px]'>
                        Our charging infrastructure combines advanced hardware
                        with intelligent network management to deliver reliable,
                        high-performance EV charging.
                    </p>
                </div>

                {/* Slides Area */}
                <div
                    ref={slidesContainerRef}
                    className='relative w-full'
                    style={{
                        height: 'calc(100% - 260px)',
                    }}>
                    {slides.map((slide, index) => (
                        <TechnologyBackedSlide
                            key={index}
                            slide={slide}
                            style={
                                index > 0
                                    ? {
                                          opacity: 0,
                                          transform: 'translateX(0%)',
                                      }
                                    : undefined
                            }
                            ref={el => {
                                slideRefs.current[index] = el;
                            }}
                            textRef={el => {
                                textRefs.current[index] = el;
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

