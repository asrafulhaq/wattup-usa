'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FadeUpProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    yOffset?: number;
    className?: string;
    triggerOnce?: boolean;
}

export function FadeUp({
    children,
    delay = 0,
    duration = 0.8,
    yOffset = 50,
    className = '',
    triggerOnce = true
}: FadeUpProps) {
    const elRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        gsap.fromTo(
            el,
            {
                opacity: 0,
                y: yOffset
            },
            {
                opacity: 1,
                y: 0,
                duration: duration,
                delay: delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: triggerOnce
                }
            }
        );

        return () => {
            ScrollTrigger.getById(el.id)?.kill();
        };
    }, [delay, duration, yOffset, triggerOnce]);

    return (
        <div ref={elRef} className={className}>
            {children}
        </div>
    );
}
