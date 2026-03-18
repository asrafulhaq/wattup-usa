import { FadeUp } from '@/components/ui/fade-up';
import { getBlurDataUrl } from '@/lib/image-utils';
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
    imageWrapperClass,
    imageClass,
    sectionClass,
    headingClass,
    subHeadingClass,
    contentContainerClass,
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
    imageWrapperClass?: string;
    imageClass?: string;
    sectionClass?: string;
    contentContainerClass?: string;
    headingClass?: string;
    subHeadingClass?: string;
    overlayClass?: string;
    overlay?: boolean;
}) {
    const desktopImagePath = image || '/assets/images/for-driver-page-hero.png';
    const blurDataURL = await getBlurDataUrl(desktopImagePath);

    let mobileBlurDataURL = blurDataURL;
    if (mobileImage) {
        mobileBlurDataURL = await getBlurDataUrl(mobileImage);
    }

    return (
        <section
            className={cn(
                'relative overflow-x-hidden mx-auto w-full h-[744px] md:aspect-1440/951 md:h-[951px] xl:h-[1080px] flex flex-col items-center justify-start pt-[99px] md:pt-[116px] overflow-hidden',
                sectionClass
            )}>
            {/* Background Image Setup */}
            <div
                className={cn(
                    'absolute inset-0 z-0 select-none',
                    imageWrapperClass
                )}>
                {mobileImage && (
                    <Image
                        src={
                            mobileImage ||
                            '/assets/images/for-driver-page-hero.png'
                        }
                        alt={alt || 'Page Hero Background'}
                        fill
                        className={cn(
                            'object-cover md:hidden md:object-center',
                            imageClass
                        )}
                        placeholder={mobileBlurDataURL ? 'blur' : 'empty'}
                        blurDataURL={mobileBlurDataURL}
                        preload={true}
                        draggable={false}
                    />
                )}
                <Image
                    src={image || '/assets/images/for-driver-page-hero.png'}
                    alt={alt || 'Page Hero Background'}
                    fill
                    className={cn(
                        'object-cover md:object-top',
                        imageClass,
                        mobileImage && 'hidden md:block'
                    )}
                    priority
                    draggable={false}
                    placeholder={blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={blurDataURL}
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
                    'relative z-10 container mx-auto flex flex-col items-center text-center text-white',
                    contentContainerClass
                )}>
                <FadeUp yOffset={30}>
                    <h1
                        className={cn(
                            'headline  mb-4 md:mb-5 text-white',
                            headingClass
                        )}>
                        {heading || 'EV Charging Made Simple'}
                    </h1>
                </FadeUp>

                {subHeading && (
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
                )}
                {buttonLink && buttonText && (
                    <FadeUp
                        delay={0.4}
                        yOffset={20}
                        className='w-full flex-col font-sans'>
                        <div className='flex items-center justify-center '>
                            <Link
                                href={buttonLink || '/find-charger'}
                                className={cn(
                                    'w-full sm:w-[210px] flex items-center justify-center px-[28px] py-[16px] rounded-[8px] font-bold text-[16px] leading-[130%] tracking-[-0.03em] transition-colors duration-500 shadow-btn whitespace-nowrap',
                                    buttonLight
                                        ? 'bg-white hover:bg-white/90 text-dark'
                                        : 'bg-primary hover:bg-primary-hover text-white'
                                )}>
                                {buttonText || 'Find a Charger'}
                            </Link>
                        </div>
                    </FadeUp>
                )}
            </div>
        </section>
    );
}

export default PageHero;


