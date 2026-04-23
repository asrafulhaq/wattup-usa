import { FadeUp } from '@/components/ui/fade-up';
import { HomePageHowItWorksStepData, HowItWorksStepData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CardSlider } from '../ui/card-slider';

function StepCard({
    step,
    isMobileSlider = false,
    descClass,
}: {
    step: HowItWorksStepData;
    isMobileSlider?: boolean;
    descClass?: string;
}) {
    return (
        <div className='flex flex-col'>
            {/* Image Container: 373px height on mobile, 472px on desktop */}
            <div
                className={`relative w-full rounded-[8px] overflow-hidden bg-gray-light shrink-0 ${isMobileSlider ? 'h-[373px] mb-4' : 'h-[472px] mb-6'} `}>
                <Image
                    src={step.image}
                    alt='How it Works - Wattup'
                    fill
                    className='object-cover transition-transform duration-700 hover:scale-105'
                    sizes={
                        isMobileSlider
                            ? '(max-width: 768px) 100vw, 33vw'
                            : '(max-width: 768px) 100vw, 33vw'
                    }
                />
            </div>
            {/* Text Container: Gap 8px between Title and Description */}
            <div className='flex flex-col gap-2'>
                <h3 className='headline-4 text-dark'>{step.title}</h3>
                <p className={cn('text-description text-dark/70', descClass)}>
                    {step.description}
                </p>
            </div>
        </div>
    );
}

export function HowItWorks({
    heading,
    stepData = HomePageHowItWorksStepData,
    gridClass = 'grid-cols-3',
    descClass,
}: {
    heading?: React.ReactNode;
    stepData?: HowItWorksStepData[];
    gridClass?: string;
    descClass?: string;
}) {
    const mobileSlides = stepData?.map(
        (step: HowItWorksStepData, index: number) => ({
            id: index,
            content: <StepCard step={step} isMobileSlider={true} />,
        })
    );

    return (
        <section className='w-full common-section-padding bg-white overflow-hidden'>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        {heading || 'How It Works'}
                    </h2>
                </FadeUp>

                {/* Desktop Grid View */}
                <div
                    className={cn(
                        'hidden md:grid grid-cols-3 gap-5',
                        gridClass
                    )}>
                    {stepData.map((step, index) => (
                        <FadeUp key={index} delay={index * 0.2}>
                            <StepCard
                                descClass={descClass}
                                step={step}
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

