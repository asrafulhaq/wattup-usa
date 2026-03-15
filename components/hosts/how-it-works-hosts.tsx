import { FadeUp } from '@/components/ui/fade-up';
import { HostPageHowItWorksStepsData } from '@/data';
import Image from 'next/image';

export function HowItWorksForHosts() {
    return (
        <section className='w-full max-w-[1440px] mx-auto common-section-padding'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}
                <FadeUp>
                    <h2 className='headline-dark mb-[40px]'>How It Works</h2>
                </FadeUp>

                {/* Grid Layout */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    {HostPageHowItWorksStepsData.map((step, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <div className='flex flex-col gap-6 group cursor-pointer'>
                                {/* Image Container */}
                                <div className='relative w-full rounded-[8px] overflow-hidden'>
                                    <Image
                                        src={step.image}
                                        alt={step.title}
                                        height={370}
                                        width={670}
                                        className='object-cover transition-transform  h-[370px] w-full duration-500 group-hover:scale-105'
                                    />
                                </div>
                                <div className='content'>
                                    {/* Title */}
                                    <h3 className='headline-4 text-dark mb-3'>
                                        {step.title}
                                    </h3>
                                    <p className='text-lg md:text-[20px] font-normal max-w-[670px] leading-[120%] text-dark/70'>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

