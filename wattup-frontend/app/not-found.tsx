import { notFoundImageUrls } from '@/lib/images/not-found';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { baseUrl } from './(frontend)/page';

export const metadata: Metadata = {
    title: '404 | WattUp USA',
    description: '404 | WattUp USA',
    openGraph: {
        title: '404 | WattUp USA',
        description: '404 | WattUp USA',
        images: [
            {
                url: notFoundImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: '404 | WattUp USA',
        description: '404 | WattUp USA',
        images: [
            {
                url: notFoundImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};
export default function NotFound() {
    return (
        <main className='flex w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            <section
                className={cn(
                    'relative overflow-x-hidden mx-auto w-full h-[754px] md:aspect-1440/951 md:h-[951px] xl:h-[1080px] flex flex-col items-center justify-start overflow-hidden'
                )}>
                {/* Background Image Setup */}
                <div
                    className={cn(
                        'absolute inset-0 z-0 select-none bg-[#032e4d]'
                    )}>
                    <Image
                        src={notFoundImageUrls.heroImage}
                        alt={'Page Hero Background'}
                        fill
                        className={cn('hidden md:block object-cover md:object-top')}
                        priority
                        draggable={false}
                    />
                    <Image
                        src={notFoundImageUrls.heroImageMobile}
                        alt={'Page Hero Background'}
                        fill
                        className={cn('md:hidden object-cover object-center')}
                        priority
                        draggable={false}
                    />
                </div>

                {/* Content Container */}
                <div
                    className={cn(
                        'flex flex-col items-center justify-start pt-[140px] md:pt-[200px] grow w-full z-10 bg-transparent'
                    )}>
                    <div className='relative z-10 container mx-auto flex flex-col items-center text-center text-white'>
                        {/* The CSS keyframe, not <FadeUp>.

                            FadeUp is a client component that imports gsap and
                            gsap/ScrollTrigger and calls registerPlugin at module scope.
                            Next puts the root not-found boundary in EVERY route's client
                            bundle, and this file was the only thing in the root tree
                            reaching gsap, so a 42 KB gzipped, 113 KB parsed animation
                            library shipped with /dashboard, /admin and every marketing
                            page. Measured from the served HTML: one reference to the gsap
                            chunk on every dashboard route.

                            .wattup-page-enter is the keyframe globals.css already carries
                            for exactly this, added when a JS animation left content at
                            opacity 0 on a slow load. A 404 does not need a scroll
                            triggered timeline: nothing here can be below the fold. */}
                        <h1
                            className={cn(
                                'wattup-page-enter text-[100px] md:text-[250px] font-semibold leading-[130%] tracking-[-3%] mb-4 md:mb-6'
                            )}>
                            404
                        </h1>

                        <p
                            className={cn(
                                'wattup-page-enter text-[20px] md:text-[32px] font-normal max-w-[416px] mx-auto leading-[120%] [animation-delay:200ms]'
                            )}>
                            Page not found
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}


