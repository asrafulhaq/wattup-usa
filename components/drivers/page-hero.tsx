import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export function PageHero({
    image,
    heading,
    subHeading,
    buttonText,
    buttonLink,
    buttonLight,
    imageWrapperClass,
    imageClass,
    sectionClass,
    headingClass,
    subHeadingClass,
    overlayClass,
    overlay = true,
    alt,
}: {
    image?: string;
    alt?: string;
    heading: React.ReactNode;
    subHeading: React.ReactNode;
    buttonText: string;
    buttonLink: string;
    buttonLight?: boolean;
    imageWrapperClass?: string;
    imageClass?: string;
    sectionClass?: string;
    headingClass?: string;
    subHeadingClass?: string;
    overlayClass?: string;
    overlay?: boolean;
}) {
    return (
        <section
            className={cn(
                'relative overflow-x-hidden mx-auto w-full h-[744px] md:aspect-1440/951 md:h-[951px] flex flex-col items-center justify-start pt-[99px] md:pt-[116px] overflow-hidden',
                sectionClass
            )}>
            {/* Background Image Setup */}
            <div
                className={cn(
                    'absolute inset-0 z-0 select-none -mb-7',
                    imageWrapperClass
                )}>
                <Image
                    src={image || '/assets/images/for-driver-page-hero.png'}
                    alt={alt || 'Page Hero Background'}
                    fill
                    className={cn(
                        'object-cover  object-[77%_100%] md:object-center',
                        imageClass
                    )}
                    priority
                    draggable={false}
                />

                {/* Subtle Gradient Overlay for Text Readability */}
                {overlay && (
                    <div
                        className={cn(
                            'absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent',
                            overlayClass
                        )}
                    />
                )}
            </div>

            {/* Content Container */}
            <div className='relative z-10 container mx-auto flex flex-col items-center text-center text-white'>
                <FadeUp yOffset={30}>
                    <h1
                        className={cn(
                            'headline mb-4 md:mb-5 text-white',
                            headingClass
                        )}>
                        {heading || 'EV Charging Made Simple'}
                    </h1>
                </FadeUp>

                <FadeUp delay={0.2} yOffset={20}>
                    <p
                        className={cn(
                            'text-[16px] md:text-[20px] font-normal max-w-[416px] mx-auto mb-6 md:mb-8 leading-[120%] text-white',
                            subHeadingClass
                        )}>
                        {subHeading || (
                            <>
                                Fast, reliable charging stations located
                                <br className='hidden sm:block' />
                                where you live, work, and travel.
                            </>
                        )}
                    </p>
                </FadeUp>

                <FadeUp
                    delay={0.4}
                    yOffset={20}
                    className='w-full flex-col font-sans'>
                    <div className='flex items-center justify-center '>
                        <Link
                            href={buttonLink || '/find-charger'}
                            className={cn(
                                'w-full sm:w-[210px] flex items-center justify-center px-[28px] py-[16px] rounded-[8px] font-bold text-[16px] leading-[130%] tracking-[-0.03em] transition-transform hover:-translate-y-0.5 shadow-btn whitespace-nowrap',
                                buttonLight
                                    ? 'bg-white hover:bg-white/90 text-dark'
                                    : 'bg-primary hover:bg-primary-hover text-white'
                            )}>
                            {buttonText || 'Find a Charger'}
                        </Link>
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

export default PageHero;

