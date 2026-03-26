import { notFoundImageUrls } from '@/lib/images/not-found';
import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { baseUrl } from './page';

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
                        className={cn('object-cover md:object-top')}
                        priority
                        draggable={false}
                    />

                    {/* Subtle Gradient Overlay for Text Readability */}

                    <div
                        className={cn(
                            'absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent'
                        )}
                    />
                </div>

                {/* Content Container */}
                <div
                    className={cn(
                        'flex flex-col items-center justify-start pt-[140px] md:pt-[200px] grow w-full z-10 bg-transparent'
                    )}>
                    <div className='relative z-10 container mx-auto flex flex-col items-center text-center text-white'>
                        <FadeUp yOffset={30}>
                            <h1 className={cn('text-[100px] md:text-[250px] font-semibold leading-[130%] tracking-[-3%] mb-4 md:mb-6')}>
                                404
                            </h1>
                        </FadeUp>

                        <FadeUp delay={0.2} yOffset={20}>
                            <p
                                className={cn(
                                    'text-[20px] md:text-[32px] font-normal max-w-[416px] mx-auto leading-[120%]'
                                )}>
                                Page not found
                            </p>
                        </FadeUp>

                    </div>
                </div>
            </section>
        </main>
    );
}

