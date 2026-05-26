'use client';

import { homeImageUrls } from '@/lib/images/home';
import { cloudinaryVideoUrl, videos } from '@/lib/images/videos';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export function VideoPresentation() {
    const sectionRef = useRef<HTMLElement>(null);
    const desktopVideoRef = useRef<HTMLVideoElement>(null);
    const mobileVideoRef = useRef<HTMLVideoElement>(null);
    const [desktopPlaying, setDesktopPlaying] = useState(false);
    const [mobilePlaying, setMobilePlaying] = useState(false);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const desktop = desktopVideoRef.current;
                    const mobile = mobileVideoRef.current;
                    if (desktop && desktop.preload !== 'auto') {
                        desktop.preload = 'auto';
                        desktop.load();
                    }
                    if (mobile && mobile.preload !== 'auto') {
                        mobile.preload = 'auto';
                        mobile.load();
                    }
                    observer.disconnect();
                }
            },
            { rootMargin: '600px' }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    const desktopPoster = homeImageUrls.technologyBacked2;
    const mobilePoster = homeImageUrls.technologyBacked2Full;

    return (
        <section
            ref={sectionRef}
            className='relative common-section-padding mx-auto w-full max-md:aspect-9/16 aspect-video bg-black overflow-hidden flex items-center justify-center'>
            <div className='absolute inset-0 z-0'>
                {/* Desktop */}
                <video
                    ref={desktopVideoRef}
                    className='w-full max-md:hidden h-full object-cover opacity-60'
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='metadata'
                    poster={desktopPoster}
                    onPlaying={() => setDesktopPlaying(true)}>
                    <source
                        src={cloudinaryVideoUrl(videos.video1)}
                        type='video/mp4'
                    />
                </video>
                {!desktopPlaying && (
                    <Image
                        src={desktopPoster}
                        alt=''
                        aria-hidden='true'
                        fill
                        className='object-cover max-md:hidden'
                        unoptimized
                    />
                )}

                {/* Mobile */}
                <video
                    ref={mobileVideoRef}
                    className='w-full md:hidden h-full object-cover opacity-60'
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='metadata'
                    poster={mobilePoster}
                    onPlaying={() => setMobilePlaying(true)}>
                    <source
                        src={cloudinaryVideoUrl(videos.videoMobile)}
                        type='video/mp4'
                    />
                </video>
                {!mobilePlaying && (
                    <Image
                        src={mobilePoster}
                        alt=''
                        aria-hidden='true'
                        fill
                        className='object-contain md:hidden'
                        unoptimized
                    />
                )}
            </div>
        </section>
    );
}

