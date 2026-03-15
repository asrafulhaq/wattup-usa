import { FadeUp } from '@/components/ui/fade-up';
import { CarginglocationsForDrivers, LocationData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CardSlider } from '../ui/card-slider';

function LocationCard({
    location,
    isMobileSlider = false,
}: {
    location: LocationData;
    isMobileSlider?: boolean;
}) {
    return (
        <div className='flex flex-col gap-6 group cursor-pointer w-full'>
            {/* Image Container */}
            <div
                className={cn(
                    'relative w-full rounded-[8px] overflow-hidden',
                    isMobileSlider ? 'h-[373px] sm:h-[373px]' : 'h-[370px]'
                )}>
                <Image
                    src={location.image}
                    alt={location.title}
                    fill
                    className='object-cover transition-transform w-full duration-500 group-hover:scale-105'
                    sizes={
                        isMobileSlider
                            ? '(max-width: 768px) 100vw, 50vw'
                            : '(max-width: 768px) 100vw, 50vw'
                    }
                />
            </div>
            {/* Title */}
            <h3 className='headline-4 text-nowrap text-dark'>
                {location.title}
            </h3>
        </div>
    );
}

export function ChargingWhereYouGo({
    heading,
    locations = CarginglocationsForDrivers,
}: {
    heading?: React.ReactNode;
    locations: LocationData[];
}) {
    const mobileSlides = locations.map((location, index) => ({
        id: index,
        content: <LocationCard location={location} isMobileSlider={true} />,
    }));

    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding overflow-hidden'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}
                <FadeUp>
                    <h2 className='headline-dark text-nowrap mb-[40px]'>
                        {heading || 'Charging where you go'}
                    </h2>
                </FadeUp>

                {/* Desktop Grid Layout */}
                <div className='hidden md:grid grid-cols-2 gap-10'>
                    {locations.map((location, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <LocationCard
                                location={location}
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
                            mobilePerView={1.05} // ~90% width to show a peek of the next card
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

