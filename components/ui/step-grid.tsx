import { FadeUp } from '@/components/ui/fade-up';
import { HomePageHowItWorksStepData, HowItWorksStepData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CardSlider } from './card-slider';

/**
 * StepCard — internal card rendered inside StepGrid.
 *
 * Supports optional `mobileImage` so the same component works for pages
 * (e.g. Hosts) that supply separate mobile crops.
 */
function StepCard({
    step,
    isMobileSlider = false,
    descClass,
    titleClass,
    cardImageHeight = 'h-[472px]',
}: {
    step: HowItWorksStepData;
    isMobileSlider?: boolean;
    descClass?: string;
    titleClass?: string;
    /** Desktop image height class. Default: 'h-[472px]'. Hosts use 'h-[370px]'. */
    cardImageHeight?: string;
}) {
    const imgSizes = '(max-width: 768px) 100vw, 33vw';
    return (
        <div className='flex flex-col'>
            {/* Image container */}
            <div
                className={`relative w-full rounded-[8px] overflow-hidden bg-gray-light shrink-0 ${
                    isMobileSlider
                        ? 'h-[373px] mb-4'
                        : `${cardImageHeight} mb-6`
                }`}>
                {/* Mobile-specific image (hidden on md+) */}
                {step?.mobileImage && (
                    <Image
                        src={step.mobileImage}
                        alt='Step image'
                        fill
                        className={cn(
                            'max-md:block hidden object-cover transition-transform w-full duration-500',
                            step?.imageClass
                        )}
                        sizes={imgSizes}
                    />
                )}
                {/* Primary image (hidden on mobile when mobileImage supplied) */}
                <Image
                    src={step.image}
                    alt='Step image'
                    fill
                    className={cn(
                        'object-cover transition-transform duration-700 hover:scale-105',
                        step?.imageClass,
                        step?.mobileImage && 'hidden md:block'
                    )}
                    sizes={imgSizes}
                />
            </div>

            {/* Text */}
            <div className='flex flex-col gap-2'>
                <h3 className={cn('headline-4 text-dark', titleClass)}>
                    {step.title}
                </h3>
                {step.description && (
                    <p
                        className={cn(
                            'text-[16px] font-medium md:text-[20px] md:font-semibold text-dark/70',
                            descClass
                        )}>
                        {step.description}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * StepGrid — generic image + title + description card grid.
 *
 * Desktop: responsive CSS grid (cols controlled by `gridClass`).
 * Mobile: Embla carousel with dots.
 *
 * ### Usage
 * ```tsx
 * // Home — "How It Works"
 * <StepGrid heading='How It Works' stepData={HomePageHowItWorksStepData} />
 *
 * // About — "Core Principles" (4 cols)
 * <StepGrid heading='Our Core Principles' stepData={AboutPageCorePrinciplesData} gridClass='grid-cols-4' />
 *
 * // Capital Partners — "Why WattUp USA" (4 cols, custom type sizes)
 * <StepGrid
 *     heading='Why WattUp USA'
 *     stepData={CapitalPartnersWhyData}
 *     gridClass='grid-cols-4'
 *     titleClass='text-[28px]! font-bold!'
 *     descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
 * />
 * ```
 *
 * Replaces: `HowItWorks` (home/how-it-works.tsx) and `HowItWorksForHosts` (hosts/how-it-works-hosts.tsx)
 */
export function StepGrid({
    heading,
    titleClass,
    stepData = HomePageHowItWorksStepData,
    gridClass = 'grid-cols-3',
    descClass,
    sectionClass,
    cardImageHeight,
}: {
    heading?: React.ReactNode;
    titleClass?: string;
    stepData?: HowItWorksStepData[];
    gridClass?: string;
    descClass?: string;
    /** Extra classes merged onto the outer <section>. Use for max-width, bg, etc. */
    sectionClass?: string;
    /** Desktop image height class. Default: 'h-[472px]'. Pass 'h-[370px]' for 2-col layouts. */
    cardImageHeight?: string;
}) {
    const mobileSlides = stepData.map((step, index) => ({
        id: index,
        content: (
            <StepCard
                step={step}
                isMobileSlider={true}
                descClass={descClass}
                titleClass={titleClass}
                cardImageHeight={cardImageHeight}
            />
        ),
    }));

    return (
        <section
            className={cn(
                'w-full common-section-padding bg-white overflow-hidden',
                sectionClass
            )}>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        {heading || 'How It Works'}
                    </h2>
                </FadeUp>

                {/* Desktop Grid */}
                <div className={cn('hidden md:grid gap-5', gridClass)}>
                    {stepData.map((step, index) => (
                        <FadeUp key={index} delay={index * 0.2}>
                            <StepCard
                                titleClass={titleClass}
                                descClass={descClass}
                                step={step}
                                isMobileSlider={false}
                                cardImageHeight={cardImageHeight}
                            />
                        </FadeUp>
                    ))}
                </div>

                {/* Mobile Slider */}
                <div className='block md:hidden'>
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

