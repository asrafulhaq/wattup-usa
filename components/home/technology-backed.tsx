'use client';

import { HomePagetechnologySlidesData, TechnologySlideData } from '@/data';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { TechnologyBackedSlide } from './technology-backed-slide';

gsap.registerPlugin(ScrollTrigger);

export function TechnologyBacked({
    slides = HomePagetechnologySlidesData,
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
                        opacity: 1,
                        scale: 1,
                    });
                } else {
                    gsap.set(slide, {
                        opacity: 0,
                        scale: 0.95,
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

            // --- TIMING CONFIGURATION ---
            /** 
             * STAY_TIME: How long each slide remains static (in timeline units).
             * Increase this to make slides "stick" longer.
             */
            const STAY_TIME = 10; 

            /**
             * TRANSITION_TIME: How long the animation between slides takes.
             * Increase this for slower transitions, decrease for faster ones.
             */
            const TRANSITION_TIME = 10;

            /**
             * SCROLL_SPEED_MULTIPLIER: Controls the total scroll distance.
             * A value of 50 means each timeline unit (1 durations) equals 50% of viewport height.
             * Higher values = slower overall scroll speed (more scrolling needed).
             */
            const SCROLL_SPEED_MULTIPLIER = 50;

            // --- CALCULATIONS ---
            // Total units spent staying still
            const totalStayUnits = slides.length * STAY_TIME;
            // Total units spent transitioning (one less than slides)
            const totalTransitionUnits = (slides.length - 1) * TRANSITION_TIME;
            // Calculate total scroll distance in % of viewport height
            const totalScrollPercentage = (totalStayUnits + totalTransitionUnits) * SCROLL_SPEED_MULTIPLIER;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: `+=${totalScrollPercentage}%`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 2, // Smooth damping (buttery feel)
                    anticipatePin: 1,
                },
            });

            slides.forEach((_, i) => {
                // 1. Hold: Stay on the current slide
                tl.to({}, { duration: STAY_TIME });

                // 2. Transition: Move to next slide if it exists
                if (i < slides.length - 1) {
                    tl.to(
                        slideRefs.current[i],
                        {
                            opacity: 0,
                            scale: 0.95,
                            duration: TRANSITION_TIME,
                            ease: 'none', // 'none' is best for scrub timelines to keep speed linear with scroll
                        },
                        '>'
                    )
                        .to(
                            textRefs.current[i],
                            {
                                opacity: 0,
                                duration: TRANSITION_TIME,
                                ease: 'none',
                            },
                            '<'
                        )
                        .to(
                            slideRefs.current[i + 1],
                            {
                                opacity: 1,
                                scale: 1,
                                duration: TRANSITION_TIME,
                                ease: 'none',
                            },
                            '<'
                        )
                        .to(
                            textRefs.current[i + 1],
                            {
                                opacity: 1,
                                duration: TRANSITION_TIME,
                                ease: 'none',
                            },
                            '<'
                        );
                }
            });
        }, section);

        return () => ctx.revert();
    }, [slides]);

    return (
        <section
            ref={sectionRef}
            className='relative common-section-padding z-10 h-auto md:min-h-screen bg-black overflow-hidden'>
            {/* Inner container capped at 1440px */}
            <div className='relative w-full max-w-[1444px] mx-auto h-full flex flex-col'>
                {/* Header — stays on top */}
                <div className='relative z-30 flex flex-col items-center text-center shrink-0'>
                    <h2 className='headline-white mb-4'>
                        Technology Backed
                        <br />
                        by Global Innovation
                    </h2>
                    <p className='text-description text-white/60 max-w-[534px] mb-[40px] md:mb-[54px]'>
                        Our charging infrastructure combines advanced hardware
                        with intelligent network management to deliver reliable,
                        high-performance EV charging.
                    </p>
                </div>

                {/* Slides Area */}
                <div
                    ref={slidesContainerRef}
                    className='relative w-full grow max-md:h-[600px] overflow-hidden'>
                    {slides.map((slide, index) => (
                        <TechnologyBackedSlide
                            key={index}
                            slide={slide}
                            style={index > 0 ? { opacity: 0 } : undefined}
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

