import { aboutImageUrls } from '@/lib/images/about';
import { AboutPageCorePrinciplesData } from '@/data';
import Image from 'next/image';

export function CorePrinciples() {
    return (
        <section className='relative w-full bg-white flex flex-col items-center justify-center overflow-hidden common-section-padding'>
            <div className='relative w-full container mx-auto max-md:px-4 flex flex-col'>
                {/* Header */}
                <h2 className='headline-dark mb-6 md:mb-[40px]'>
                    Our core principles
                </h2>

                {/* Main Image */}
                <div className='relative w-full h-[400px] lg:h-[681px] rounded-[8px] overflow-hidden mb-6 md:mb-[32px]'>
                    <Image
                        src={aboutImageUrls.corePrincipals}
                        alt='Core Principles - EV Charging'
                        fill
                        className='object-cover max-md:object-[65%_center]'
                        priority
                    />
                </div>

                {/* Principles Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]'>
                    {AboutPageCorePrinciplesData.map((principle, index) => (
                        <div key={index} className='flex flex-col gap-3'>
                            <h3 className='headline-4 text-dark'>
                                {principle.title}
                            </h3>
                            <p className='text-description max-md:font-medium text-dark/70'>
                                {principle.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

