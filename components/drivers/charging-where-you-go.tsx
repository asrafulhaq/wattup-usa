import { FadeUp } from '@/components/ui/fade-up';
import Image from 'next/image';

export function ChargingWhereYouGo() {
    const locations = [
        {
            title: 'Retail Centers',
            image: '/assets/images/card-image-1.png',
        },
        {
            title: 'Hotels',
            image: '/assets/images/card-image-2.png',
        },
        {
            title: 'Office Buildings',
            image: '/assets/images/card-image-5.png',
        },
        {
            title: 'Residential Communities',
            image: '/assets/images/card-image-4.png',
        },
    ];

    return (
        <section className='w-full max-w-[1440px] mx-auto common-section-padding'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}
                <FadeUp>
                    <h2 className='headline-dark mb-[40px]'>
                        Charging where you go
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

