'use client';

import { FadeUp } from '@/components/ui/fade-up';

export function TechnologyBacked() {
    return (
        <section className="relative w-full h-[600px] md:h-[800px] bg-black overflow-hidden flex items-center justify-center">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    className="w-full h-full object-cover opacity-60"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/assets/images/hero-2.png" 
                >
                    <source src="/assets/videos/video-1.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/80" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 container text-center flex flex-col items-center">
                <FadeUp>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                        Technology Backed by<br />
                        Global Innovators
                    </h2>
                </FadeUp>
                <FadeUp delay={0.2}>
                    <p className="text-lg md:text-xl font-medium text-gray-light/80 max-w-2xl mx-auto">
                        WATTUP integrates industry-leading hardware and software for a seamless, high-performance EV charging experience.
                    </p>
                </FadeUp>
            </div>
        </section>
    );
}
