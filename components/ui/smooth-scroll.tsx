'use client';

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// ==========================================
// LENIS SMOOTH SCROLL CONFIGURATION
// ==========================================
// Adjust these variables to tune the feel of the scroll across the entire site.

// How long the scroll animation lasts (in seconds). Higher = slower/smoother.
const SCROLL_DURATION = 1.5;

// Multiplier for mouse wheel scrolling speed. Default is 1. Higher = faster scrolling.
const WHEEL_MULTIPLIER = 1;

// Multiplier for touch/trackpad scrolling speed. Default is 2. Higher = faster scrolling on touch devices.
const TOUCH_MULTIPLIER = 2;

// Offset (in pixels) for anchor links (e.g. #contact-us). Negative values stop scrolling *above* the element.
const SCROLL_OFFSET = -10;

// Easing function used for the scroll animation. This controls the "acceleration/deceleration" feel.
// Default exponential ease-out function.
const SCROLL_EASING = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
// ==========================================

export function SmoothScroll() {
    const pathname = usePathname();

    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: SCROLL_DURATION,
            easing: SCROLL_EASING,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: WHEEL_MULTIPLIER,
            touchMultiplier: TOUCH_MULTIPLIER,
            infinite: false,
        });
        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    // Handle hash navigation on page load and route change
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            // Use a small timeout to ensure DOM is ready and Lenis is initialized
            const timeoutId = setTimeout(() => {
                const targetElement = document.querySelector(
                    hash
                ) as HTMLElement;
                if (targetElement && lenisRef.current) {
                    lenisRef.current.scrollTo(targetElement, {
                        offset: SCROLL_OFFSET,
                        duration: SCROLL_DURATION,
                    });
                }
            }, 500); // Increased timeout to 500ms slightly safer for hydration

            return () => clearTimeout(timeoutId);
        }
    }, [pathname]); // Re-run when route changes

    // Handle same-page hash clicks (optional, if Next.js Link doesn't handle it well with Lenis)
    useEffect(() => {
        const handleHashClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Match any link that contains a hash
            const anchor = target.closest('a[href*="#"]') as HTMLAnchorElement;
            
            if (anchor && lenisRef.current) {
                try {
                    // Parse the full URL from the anchor's href property
                    const url = new URL(anchor.href, window.location.href);
                    
                    // If the link points to a hash on the CURRENT page
                    if (url.pathname === window.location.pathname && url.hash) {
                        e.preventDefault();
                        
                        const targetElement = document.querySelector(
                            url.hash
                        ) as HTMLElement;
                        
                        if (targetElement) {
                            // If the URL already has this exact hash, temporarily remove it
                            // so that the browser/framework registers it as a fresh navigation
                            if (window.location.hash === url.hash) {
                                window.history.replaceState(
                                    null,
                                    '',
                                    window.location.pathname + window.location.search
                                );
                            }

                            lenisRef.current.scrollTo(targetElement, {
                                offset: SCROLL_OFFSET,
                                duration: SCROLL_DURATION,
                            });
                            
                            // Manually update URL hash without natively scrolling
                            window.history.pushState(null, '', url.href);
                        }
                    }
                } catch {
                    // Ignore invalid URLs
                }
            }
        };
        
        // Use capture phase to intercept the click BEFORE Next.js <Link> prevents default
        document.addEventListener('click', handleHashClick, { capture: true });
        return () => document.removeEventListener('click', handleHashClick, { capture: true });
    }, []);

    // Force scroll to top on route change
    useEffect(() => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0, { immediate: true });
        }
    }, [pathname]);

    return null;
}

