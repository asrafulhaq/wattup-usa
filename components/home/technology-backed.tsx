'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { FadeUp } from '../ui/fade-up';
import {
    TechnologySlide1,
    TechnologySlide2,
    TechnologySlide3,
} from './technology-slides';

gsap.registerPlugin(ScrollTrigger);

const SLIDE_COUNT = 3;
const STAY_TIME = 5;
const TRANSITION_TIME = 5;
const SCROLL_SPEED_MULTIPLIER = 25;

export function TechnologyBacked() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const slidesContainerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const textRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const ctx = gsap.context(() => {
            slideRefs.current.forEach((slide, i) => {
                if (!slide) return;
                gsap.set(
                    slide,
                    i === 0
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.95 }
                );
            });

            textRefs.current.forEach((text, i) => {
                if (!text) return;
                gsap.set(text, { opacity: i === 0 ? 1 : 0 });
            });

            const totalScrollPercentage =
                (SLIDE_COUNT * STAY_TIME +
                    (SLIDE_COUNT - 1) * TRANSITION_TIME) *
                SCROLL_SPEED_MULTIPLIER;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: `+=${totalScrollPercentage}%`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 2,
                    anticipatePin: 1,
                },
            });

            for (let i = 0; i < SLIDE_COUNT; i++) {
                tl.to({}, { duration: STAY_TIME });
                if (i < SLIDE_COUNT - 1) {
                    tl.to(
                        slideRefs.current[i],
                        {
                            opacity: 0,
                            scale: 0.95,
                            duration: TRANSITION_TIME,
                            ease: 'none',
                        },
                        '>'
                    )
                        .to(
                            textRefs.current[i],
                            { opacity: 0, duration: TRANSITION_TIME, ease: 'none' },
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
                            { opacity: 1, duration: TRANSITION_TIME, ease: 'none' },
                            '<'
                        );
                }
            }
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id='technology'
            className='relative common-section-padding z-10 h-auto bg-black overflow-hidden'>
            <div className='relative w-screen h-full  flex flex-col'>
                {/* Section header */}
                <div className='relative z-30 flex flex-col items-center text-center shrink-0'>
                    <FadeUp>
                        <h2 className='headline-white mb-4'>
                            Technology Backed
                            <br />
                            by Global Innovation
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <p className='text-description text-white/60 max-md:max-w-87 max-w-133.5 mb-10 md:mb-13.5'>
                            Our charging infrastructure combines advanced
                            hardware with intelligent network management to
                            deliver reliable, high-performance EV charging.
                        </p>
                    </FadeUp>
                </div>

                {/* Pinned slides area */}
                <div ref={sectionRef} className='scroll-section'>
                    <div
                        ref={slidesContainerRef}
                        className='relative w-full grow h-dvh overflow-hidden'>
                        <TechnologySlide1
                            slideRef={el => {
                                slideRefs.current[0] = el;
                            }}
                            textRef={el => {
                                textRefs.current[0] = el;
                            }}
                        />
                        <TechnologySlide2
                            slideRef={el => {
                                slideRefs.current[1] = el;
                            }}
                            textRef={el => {
                                textRefs.current[1] = el;
                            }}
                            style={{ opacity: 0 }}
                        />
                        <TechnologySlide3
                            slideRef={el => {
                                slideRefs.current[2] = el;
                            }}
                            textRef={el => {
                                textRefs.current[2] = el;
                            }}
                            style={{ opacity: 0 }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
