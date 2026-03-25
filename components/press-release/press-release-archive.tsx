import { FadeUp } from '@/components/ui/fade-up';
import { PressReleaseArchiveData, pressReleaseArchiveData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { CardSlider } from '../ui/card-slider';

function PressReleaseCard({
    item,
    isMobileSlider = false,
}: {
    item: PressReleaseArchiveData;
    isMobileSlider?: boolean;
}) {
    return (
        <div className='flex flex-col gap-5 group cursor-pointer w-full'>
            {/* Image Container */}
            <div
                className={cn(
                    'relative w-full max-w-[330px] md:max-w-[670px] rounded-[8px] overflow-hidden',
                    isMobileSlider ? 'h-[373px] sm:h-[373px]' : 'h-[370px]'
                )}>
                {item?.mobileImage && (
                    <Image
                        src={item.mobileImage}
                        alt='How it Works - Wattup'
                        fill
                        className={cn(
                            'max-md:block hidden object-cover transition-transform w-full duration-500',
                            item?.imageClass
                        )}
                        sizes={
                            isMobileSlider
                                ? '(max-width: 768px) 100vw, 50vw'
                                : '(max-width: 768px) 100vw, 50vw'
                        }
                    />
                )}

                <Image
                    src={item.image}
                    alt='How it Works - Wattup'
                    fill
                    className={cn(
                        'object-cover transition-transform w-full duration-500',
                        item?.imageClass,
                        item?.mobileImage && 'hidden md:block'
                    )}
                    sizes={
                        isMobileSlider
                            ? '(max-width: 768px) 100vw, 50vw'
                            : '(max-width: 768px) 100vw, 50vw'
                    }
                />
            </div>
            <div className='content flex max-w-[330px] md:max-w-[670px] flex-col gap-5'>
                {/*  Date */}
                <p className='text-[20px] font-semibold max-w-[670px] leading-[130%] traking-[-03%] text-dark/70'>
                    {item?.date || 'March 25, 2026'}
                </p>
                {/* Title */}
                <div className='flex flex-col gap-3'>
                    <h3 className='headline-5  text-dark'>{item.title}</h3>
                    <p className='text-[16px] md:text-[20px] font-normal max-w-[670px] leading-[130%] md:leading-[120%] text-dark md:text-dark/70'>
                        {item.description}
                    </p>
                </div>
                <Link
                    href={`/press-release/${item.slug}`}
                    className='text-primary hover:text-primary-hover text-[16px] font-semibold block'>
                    Read More
                </Link>
            </div>
        </div>
    );
}

export function PressReleaseArchive() {
    const mobileSlides = pressReleaseArchiveData.map((item, index) => ({
        id: index,
        content: <PressReleaseCard item={item} isMobileSlider={true} />,
    }));

    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding max-md:pt-0! overflow-hidden'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}

                <h2 className='headline-dark hidden md:block max-md:[w-348px] mb-6'>
                    Our main news
                </h2>
                <FadeUp>
                    <p className='text-[16px] md:text-[20px] font-normal max-w-[670px] leading-[130%] md:leading-[120%] text-dark md:text-dark/70 mb-5 md:mb-[56px]'>
                        All the most important news about{' '}
                        <br className='md:hidden' /> WhattUp USA
                    </p>
                </FadeUp>

                {/* Desktop Grid Layout */}
                <div className='hidden md:grid grid-cols-2 gap-10'>
                    {pressReleaseArchiveData.map((item, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <PressReleaseCard
                                item={item}
                                isMobileSlider={false}
                            />
                        </FadeUp>
                    ))}
                </div>

                {/* Mobile Slider View */}
                <div className='block md:hidden'>
                    <FadeUp>
                        <CardSlider
                            slides={mobileSlides}
                            mobilePerView={1} // ~90% width to show a peek of the next card
                            gap={20}
                            showArrows={false}
                            showDots={true}
                            loop={false}
                        />
                    </FadeUp>
                </div>
            </div>
        </section>
    );
}


