import { AboutPageCorePrinciplesData } from '@/data';
import Image from 'next/image';

export function CorePrinciples() {
    return (
        <section className='relative w-full bg-white flex flex-col items-center justify-center overflow-hidden common-section-padding'>
            <div className='relative w-full container mx-auto flex flex-col'>
                {/* Header */}
                <h2 className='headline-dark mb-[40px]'>Our core principles</h2>

                {/* Main Image */}
                <div className='relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[681px] rounded-[8px] overflow-hidden mb-[32px]'>
                    <Image
                        src='/assets/images/core-principals.png'
                        alt='Core Principles - EV Charging'
                        fill
                        className='object-cover'
                        sizes='(max-width: 1440px) 100vw, 1360px'
                        priority
                    />
                </div>

                {/* Principles Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]'>
                    {AboutPageCorePrinciplesData.map((principle, index) => (
                        <div key={index} className='flex flex-col gap-2'>
                            <h3 className='headline-4 text-dark'>
                                {principle.title}
                            </h3>
                            <p className='text-description text-dark/70'>
                                {principle.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

