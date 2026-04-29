import { FadeUp } from '@/components/ui/fade-up';
import { PolicyOptionsData } from '@/data';
import Image from 'next/image';
import Link from 'next/link';
import { CardSlider } from '../ui/card-slider';

function StepCard({
    step,
    isMobileSlider = false,
}: {
    step: { title: string; description: string; image: string };
    isMobileSlider?: boolean;
}) {
    return (
        <div className='flex flex-col'>
            {/* Image Container: 373px height on mobile, 472px on desktop */}
            <div
                className={`relative w-full rounded-[8px] overflow-hidden bg-gray-light shrink-0 ${isMobileSlider ? 'h-[373px] mb-4' : 'h-[472px] mb-6'} `}>
                <Image
                    src={step.image}
                    alt={step.title}
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
                <p className='text-description  max-lg:font-normal! text-dark/70'>
                    {step.description}
                </p>
            </div>
        </div>
    );
}

export function PrivacyOptions() {
    const mobileSlides = PolicyOptionsData.map((step, index) => ({
        id: index,
        content: <StepCard step={step} isMobileSlider={true} />,
    }));

    return (
        <FadeUp>
            <section className='w-full common-section-padding bg-white overflow-hidden'>
                <div className='container'>
                    <h2 className='headline-dark mb-6'>Policy:</h2>

                    <FadeUp delay={0.2}>
                        <p className='text-description max-w-[842px] mb-4 font-normal! '>
                            This website is operated by WattUp USA. By accessing
                            and using this website, you agree to comply with and
                            be bound by the following legal terms and privacy
                            practices.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.4}>
                        <Link
                            href={'#'}
                            className='text-primary text-[16px] font-semibold py-[10px] mb-10! block'>
                            Read Privacy Notice
                        </Link>
                    </FadeUp>

                    {/* Desktop Grid View */}
                    <div className='hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-5'>
                        {PolicyOptionsData.map((step, index) => (
                            <FadeUp key={index} delay={index * 0.2}>
                                <StepCard step={step} isMobileSlider={false} />
                            </FadeUp>
                        ))}
                    </div>

                    {/* Mobile Slider View */}
                    <div className='block sm:hidden'>
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
        </FadeUp>
    );
}

