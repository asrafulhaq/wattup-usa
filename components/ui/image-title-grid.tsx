import { CardSlider } from '@/components/ui/card-slider';
import { FadeUp } from '@/components/ui/fade-up';
import { CarginglocationsForDrivers, LocationData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * ImageTitleCard — internal card: image + title + description.
 */
function ImageTitleCard({
    item,
    isMobileSlider = false,
    descClass,
}: {
    item: LocationData;
    isMobileSlider?: boolean;
    descClass?: string;
}) {
    return (
        <div className='flex flex-col gap-6 group cursor-pointer w-full'>
            <div
                className={cn(
                    'relative w-full rounded-[8px] overflow-hidden',
                    isMobileSlider ? 'h-[373px]' : 'h-[370px]'
                )}>
                {}
                <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={cn(
                        'object-cover transition-transform w-full duration-500 group-hover:scale-105',
                        item?.mobileImage && 'hidden md:block'
                    )}
                    sizes='(max-width: 768px) 100vw, 50vw'
                />
                {item?.mobileImage && (
                    <Image
                        src={item.mobileImage}
                        alt={item.title}
                        fill
                        className='object-cover transition-transform w-full duration-500 group-hover:scale-105 block md:hidden'
                        sizes='(max-width: 768px) 100vw, 50vw'
                    />
                )}
            </div>
            <div className='content flex flex-col gap-3!'>
                <h3 className='headline-4 text-nowrap text-dark'>
                    {item.title}
                </h3>
                {item?.description && (
                    <p
                        className={cn(
                            'text-[16px] font-medium md:text-[20px] md:font-semibold text-dark/70',
                            descClass
                        )}>
                        {item.description}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * ImageTitleGrid — 2-column image+title card grid on desktop, Embla slider on mobile.
 *
 * ### Usage
 * ```tsx
 * // Drivers — "Charging where you go"
 * <ImageTitleGrid heading='Charging where you go' items={CarginglocationsForDrivers} />
 *
 * // Hosts — same section, different heading
 * <ImageTitleGrid heading='Charging Wherever You Host' items={HostLocationsData} />
 * ```
 *
 * Replaces: `ChargingWhereYouGo` in drivers/charging-where-you-go.tsx
 */
export function ImageTitleGrid({
    heading,
    items = CarginglocationsForDrivers,
    sectionClass,
    headingClass,
}: {
    heading?: React.ReactNode;
    items: LocationData[];
    sectionClass?: string;
    headingClass?: string;
}) {
    const mobileSlides = items.map((item, index) => ({
        id: index,
        content: <ImageTitleCard item={item} isMobileSlider={true} />,
    }));

    return (
        <section
            className={cn(
                'w-full max-w-[1444px] mx-auto common-section-padding overflow-hidden',
                sectionClass
            )}>
            <div className='container mx-auto flex flex-col'>
                <FadeUp>
                    <h2
                        className={cn(
                            'headline-dark text-nowrap mb-[40px]',
                            headingClass
                        )}>
                        {heading || 'Charging where you go'}
                    </h2>
                </FadeUp>

                {/* Desktop: 2-col grid */}
                <div className='hidden sm:grid grid-cols-2 gap-10'>
                    {items.map((item, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <ImageTitleCard
                                item={item}
                                isMobileSlider={false}
                            />
                        </FadeUp>
                    ))}
                </div>

                {/* Mobile: Embla slider */}
                <div className='block sm:hidden'>
                    <FadeUp>
                        <CardSlider
                            slides={mobileSlides}
                            mobilePerView={1}
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

