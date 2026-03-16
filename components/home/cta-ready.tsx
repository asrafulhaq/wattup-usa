import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export function CTAReady({
    heading,
    subHeading,
    buttonText,
    buttonLink,
    buttonText2,
    buttonLink2,
    image,
    headingClass,
    subHeadingClass,
    overlay,
    overlayClass,
    sectionClass,
    imageWrapperClass,
    imageClass,
}: {
    heading: React.ReactNode;
    headingClass?: string;
    subHeadingClass?: string;
    sectionClass?: string;
    imageWrapperClass?: string;
    imageClass?: string;
    subHeading?: React.ReactNode;
    buttonText?: string;
    buttonLink?: string;
    buttonText2?: string;
    buttonLink2?: string;
    image?: string;
    overlay?: boolean;
    overlayClass?: string;
}) {
    return (
        <section className='relative w-full overflow-hidden text-white  mx-auto'>
            {/* Top CTA Banner - 1440x960px Figma Specs */}
            <div
                className={cn(
                    'relative w-full bg-black h-[744px] md:h-[960px] xl:h-[1080px] flex flex-col items-center justify-start  mx-auto',
                    sectionClass
                )}>
                {/* Background Image Setup */}
                <div
                    className={cn(
                        'absolute inset-0 z-0 select-none',
                        imageWrapperClass
                    )}>
                    <Image
                        src={image || '/assets/images/footer-section-bg.png'}
                        alt='WattUp Sunset Background'
                        fill
                        className={cn(
                            'object-cover md:object-center',
                            imageClass
                        )}
                        priority
                        draggable={false}
                    />
                    {/* Dark gradient overlay to match Figma contrast if needed, or just light darkening for text readability */}
                    {overlay && (
                        <div
                            className={cn(
                                'absolute inset-0 bg-black/20',
                                overlayClass
                            )}
                        />
                    )}
                </div>
                <div className='container mx-auto'>
                    <div className='relative z-10 w-full flex flex-col items-center text-center text-white pt-[99px] md:pt-[218px]'>
                        <FadeUp className='w-full'>
                            <h2
                                className={cn(
                                    'headline-white pb-6',
                                    headingClass
                                )}>
                                {heading || (
                                    <>
                                        Ready to Charge
                                        <br />
                                        with WattUp?
                                    </>
                                )}
                            </h2>
                        </FadeUp>

                        <FadeUp delay={0.2} className='w-full'>
                            <p
                                className={cn(
                                    'text-[16px] md:text-[20px] font-normal max-w-[424px] mx-auto mb-8 leading-[120%] text-white',
                                    subHeadingClass
                                )}>
                                {subHeading || (
                                    <>
                                        Find a charging station near you or
                                        partner
                                        <br className='hidden md:block' />
                                        with us to bring EV charging to your
                                        property.
                                    </>
                                )}
                            </p>
                        </FadeUp>

                        <FadeUp
                            delay={0.4}
                            className='flex flex-row items-center justify-center gap-[12px] w-full'>
                            <Link
                                href={buttonLink || '/find-charger'}
                                className='w-full sm:w-[210px] h-[53px] flex items-center justify-center bg-white text-dark hover:bg-gray-light rounded-[8px] font-bold text-[16px] shadow-btn transition-transform whitespace-nowrap'>
                                {buttonText || 'Find a Charger'}
                            </Link>
                            {buttonText2 && buttonLink2 && (
                                <Link
                                    href={buttonLink2 || '/partner'}
                                    className='w-full sm:w-[210px] h-[53px] flex items-center justify-center bg-white text-dark hover:bg-gray-light rounded-[8px] font-bold text-[16px] shadow-btn transition-transform whitespace-nowrap'>
                                    {buttonText2 || 'Partner With Us'}
                                </Link>
                            )}
                        </FadeUp>
                    </div>
                </div>
            </div>
        </section>
    );
}

