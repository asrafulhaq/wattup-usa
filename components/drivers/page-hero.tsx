import { driversImageUrls } from '@/lib/images/drivers';
import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export async function PageHero({
    image,
    mobileImage,
    heading,
    subHeading,
    buttonText,
    buttonLink,
    buttonLight,
    buttonClass,
    imageWrapperClass,
    imageClass,
    sectionClass,
    headingClass,
    subHeadingClass,
    contentContainerClass,
    textContainerClass,
    overlayClass,
    overlay = true,
    alt,
}: {
    image?: string;
    mobileImage?: string;
    alt?: string;
    heading: React.ReactNode;
    subHeading?: React.ReactNode;
    buttonText?: string;
    buttonLink?: string;
    buttonLight?: boolean;
    buttonClass?: string;
    imageWrapperClass?: string;
    imageClass?: string;
    sectionClass?: string;
    contentContainerClass?: string;
    textContainerClass?: string;
    headingClass?: string;
    subHeadingClass?: string;
    overlayClass?: string;
    overlay?: boolean;
}) {


    return (
        <section
            className={cn(
                'relative overflow-x-hidden mx-auto w-full h-[754px] md:aspect-1440/951 md:h-[951px] xl:h-[1080px] flex flex-col items-center justify-start overflow-hidden',
                sectionClass
            )}>
            {/* Background Image Setup */}
            <div
                className={cn(
                    'relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]',
                    imageWrapperClass
                )}>
                {mobileImage && (
                    <Image
                        src={
                            mobileImage ||
                            driversImageUrls.forDriverPageHero
                        }
                        alt={alt || 'Page Hero Background'}
                        fill
                        className={cn(
                            'object-cover md:hidden md:object-center',
                            imageClass
                        )}
                        priority
                        draggable={false}
                    />
                )}
                <Image
                    src={image || driversImageUrls.forDriverPageHero}
                    alt={alt || 'Page Hero Background'}
                    fill
                    className={cn(
                        'object-cover md:object-top',
                        imageClass,
                        mobileImage && 'hidden md:block'
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
            <div
                className={cn(
                    'pt-8 md:pt-[116px] flex flex-col items-center justify-start grow w-full z-10 bg-white md:bg-transparent',
                    contentContainerClass
                )}>
                <div className={cn('relative z-10 container mx-auto flex flex-col items-center text-center max-md:text-dark text-white', textContainerClass)}>
                    <FadeUp yOffset={30}>
                        <h1
                            className={cn(
                                'headline mb-4 md:mb-5',
                                headingClass
                            )}>
                            {heading || 'EV Charging Made Simple'}
                        </h1>
                    </FadeUp>

                    {subHeading && (
                        <FadeUp delay={0.2} yOffset={20}>
                            <p
                                className={cn(
                                    'text-[16px] md:text-[20px] font-normal max-w-[416px] mx-auto mb-6 md:mb-8 leading-[120%]',
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
                    )}
                    {buttonLink && buttonText && (
                        <FadeUp
                            delay={0.4}
                            yOffset={20}
                            className='w-full flex-col font-sans'>
                            <div className='flex items-center justify-center'>
                                <Link
                                    href={buttonLink || '/find-charger'}
                                    className={cn(
                                        'w-full md:w-[210px] flex items-center justify-center px-[28px] py-[16px] rounded-[8px] font-bold text-[16px] leading-[130%] tracking-[-0.03em] transition-colors duration-500 shadow-btn whitespace-nowrap',
                                        buttonLight
                                            ? 'bg-white hover:bg-white/90 text-dark'
                                            : 'bg-primary hover:bg-primary-hover text-white',
                                        buttonClass
                                    )}>
                                    {buttonText || 'Find a Charger'}
                                </Link>
                            </div>
                        </FadeUp>
                    )}
                </div>
            </div>
        </section>
    );
}

export default PageHero;

