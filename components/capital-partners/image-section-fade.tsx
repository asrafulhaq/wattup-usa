import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ImageSectionFade({
    image,
    mobileImage,
    heading,
    subHeading,
    imageHeight = 'h-[280px] xs:h-[450px] sm:h-[500px] md:h-[750px] lg:h-[900px] xl:h-[995px] 2xl:h-[1050px]! 3xl:h-[1650px]! ultra:h-[1790px]!',
    sectionClass,
    headingClass,
    subHeadingClass,
    alt = 'Leadership Team',
}: {
    image?: string;
    mobileImage?: string;
    alt?: string;
    heading?: React.ReactNode;
    subHeading?: React.ReactNode;
    imageHeight?: string;
    sectionClass?: string;
    headingClass?: string;
    subHeadingClass?: string;
}) {
    return (
        <section
            className={cn(
                'w-full bg-white common-section-padding overflow-visible',
                sectionClass
            )}>
            <div className='container relative z-10 mx-auto text-center'>
                {heading && (
                    <FadeUp>
                        <h2
                            className={cn(
                                'headline-dark mb-4 md:mb-5',
                                headingClass
                            )}>
                            {heading}
                        </h2>
                    </FadeUp>
                )}
                {subHeading && (
                    <FadeUp delay={0.2}>
                        <p
                            className={cn(
                                'text-[16px] md:text-[20px] font-normal text-dark max-w-[659px] mx-auto leading-[130%]',
                                subHeadingClass
                            )}>
                            {subHeading}
                        </p>
                    </FadeUp>
                )}
            </div>
            <FadeUp delay={0.3}>
                <div
                    className={cn(
                        'relative w-full z-0 -mt-8 md:-mt-40 ',
                        imageHeight 
                    )}>
                    {/* Mobile image — shown only below md */}
                    {mobileImage && (
                        <Image
                            src={mobileImage}
                            alt={alt}
                            fill
                            className='object-cover md:hidden'
                            sizes='100vw'
                            priority
                            draggable={false}
                        />
                    )}
                    {/* Desktop image — full bleed at all sizes, contain only at xl */}
                    <Image
                        src={image ?? ''}
                        alt={alt}
                        fill
                        className={cn(
                            'object-cover',
                            mobileImage ? 'hidden md:block' : 'block'
                        )}
                        sizes='100vw'
                        priority
                        draggable={false}
                    />
                </div>
            </FadeUp>
        </section>
    );
}


