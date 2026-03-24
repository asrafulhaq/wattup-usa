import { FadeUp } from '@/components/ui/fade-up';
import { HostPageHowItWorksStepsData, HowItWorksStepData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CardSlider } from '../ui/card-slider';

function HostStepCard({
    step,
    isMobileSlider = false,
}: {
    step: HowItWorksStepData;
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
                {step?.mobileImage && (
                    <Image
                        src={step.mobileImage}
                        alt="How it Works - Wattup"
                        fill
                        className={cn(
                            'max-md:block hidden object-cover transition-transform w-full duration-500',
                            step?.imageClass,
                            
                        )}
                        sizes={
                            isMobileSlider
                                ? '(max-width: 768px) 100vw, 50vw'
                                : '(max-width: 768px) 100vw, 50vw'
                        }
                    />
                )}

                <Image
                    src={step.image}
                    alt="How it Works - Wattup"
                    fill
                    className={cn(
                        'object-cover transition-transform w-full duration-500',
                        step?.imageClass,
                        step?.mobileImage && 'hidden md:block'
                    )}
                    sizes={
                        isMobileSlider
                            ? '(max-width: 768px) 100vw, 50vw'
                            : '(max-width: 768px) 100vw, 50vw'
                    }
                />
            </div>
            <div className='content'>
                {/* Title */}
                <h3 className='headline-4 text-nowrap text-dark mb-3'>
                    {step.title}
                </h3>
                <p className='text-[16px] md:text-[20px] font-normal max-w-[670px] leading-[130%] md:leading-[120%] text-dark/70'>
                    {step.description}
                </p>
            </div>
        </div>
    );
}

export function HowItWorksForHosts() {
    const mobileSlides = HostPageHowItWorksStepsData.map((step, index) => ({
        id: index,
        content: <HostStepCard step={step} isMobileSlider={true} />,
    }));

    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding overflow-hidden'>
            <div className='container mx-auto flex flex-col'>
                {/* Header */}
                <FadeUp>
                    <h2 className='headline-dark max-md:[w-348px] mb-[40px]'>
                        How It Works
                    </h2>
                </FadeUp>

                {/* Desktop Grid Layout */}
                <div className='hidden md:grid grid-cols-2 gap-10'>
                    {HostPageHowItWorksStepsData.map((step, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <HostStepCard step={step} isMobileSlider={false} />
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




