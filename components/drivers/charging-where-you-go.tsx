import { FadeUp } from '@/components/ui/fade-up';
import { CarginglocationsForDrivers, LocationData } from '@/data';
import Image from 'next/image';

export function ChargingWhereYouGo({
    heading,
    locations = CarginglocationsForDrivers,
}: {
    heading?: React.ReactNode;
    locations: LocationData[];
}) {
    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}
                <FadeUp>
                    <h2 className='headline-dark mb-[40px]'>
                        {heading || 'Charging where you go'}
                    </h2>
                </FadeUp>

                {/* Grid Layout */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    {locations.map((location, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <div className='flex flex-col gap-6 group cursor-pointer'>
                                {/* Image Container */}
                                <div className='relative w-full rounded-[8px] overflow-hidden'>
                                    <Image
                                        src={location.image}
                                        alt={location.title}
                                        height={370}
                                        width={670}
                                        className='object-cover transition-transform  h-[370px] w-full duration-500 group-hover:scale-105'
                                    />
                                </div>
                                {/* Title */}
                                <h3 className='headline-4 text-dark'>
                                    {location.title}
                                </h3>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

