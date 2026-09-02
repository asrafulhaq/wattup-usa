import { CardSlider } from '@/components/ui/card-slider';
import { FadeUp } from '@/components/ui/fade-up';
import { PressReleaseArchiveData, pressReleaseArchiveData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

function PressReleaseCard({
    item,
    isMobileSlider = false,
}: {
    item: PressReleaseArchiveData;
    isMobileSlider?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex gap-6 group cursor-pointer w-full items-start',
                isMobileSlider ? 'flex-col' : 'flex-col md:flex-row md:gap-8'
            )}>
            {/* Image Container */}
            <div
                className={cn(
                    'relative w-full shrink-0 rounded-[8px] overflow-hidden',
                    isMobileSlider ? 'h-[400px]' : 'h-[240px] md:w-[440px]'
                )}>
                {item?.mobileImage && (
                    <Image
                        src={item.mobileImage}
                        alt={item.title}
                        fill
                        className='max-md:block hidden object-cover transition-transform duration-500 group-hover:scale-105'
                        sizes='(max-width: 768px) 100vw, 440px'
                    />
                )}

                <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={cn(
                        'object-cover transition-transform duration-500 group-hover:scale-105',
                        item?.mobileImage && 'hidden md:block'
                    )}
                    sizes='(max-width: 768px) 100vw, 440px'
                />
            </div>

            <div className='content flex flex-col gap-3 md:gap-5 flex-1'>
                {/* Date & Read Time */}
                <p className='text-[16px] font-medium leading-[130%] tracking-[-0.03em] text-dark/70'>
                    {item?.date || 'March 25, 2026'}{' '}
                    <span className='mx-2'>•</span>
                    {item?.readTime || '5 min read'}
                </p>

                {/* Title & Description */}
                <div className='flex flex-col gap-3'>
                    <h3 className='headline-5 text-dark'>{item.title}</h3>
                    <p className='text-[16px] md:text-[20px] font-normal leading-[130%] text-dark/70 line-clamp-3'>
                        {item.description}
                    </p>
                </div>

                <Link
                    href={`/press-release/${item.slug}`}
                    className='text-primary hover:text-primary-hover py-[10px] text-[16px] font-semibold flex items-center gap-2'>
                    Keep Reading
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
                <h2 className='headline-dark max-md:w-[348px] mb-6'>
                    Our main news
                </h2>
                <FadeUp>
                    <p className='text-[16px] md:text-[20px] font-normal max-w-[670px] leading-[130%] md:leading-[120%] text-dark md:text-dark/70 mb-5 md:mb-[56px]'>
                        All the most important news about{' '}
                        <br className='md:hidden' /> WhattUp USA
                    </p>
                </FadeUp>

                {/* Desktop List View */}
                <div className='hidden md:flex flex-col gap-12'>
                    {pressReleaseArchiveData.map((item, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <PressReleaseCard item={item} />
                        </FadeUp>
                    ))}
                </div>

                {/* Mobile Slider View */}
                <div className='block md:hidden'>
                    <FadeUp>
                        <CardSlider
                            slides={mobileSlides}
                            mobilePerView={1}
                            gap={16}
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

