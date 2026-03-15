import { FadeUp } from '@/components/ui/fade-up';
import { HomePageHowItWorksStepData } from '@/data';
import Image from 'next/image';

export function HowItWorks({ heading }: { heading?: React.ReactNode }) {
    return (
        <section className='w-full common-section-padding bg-white overflow-hidden'>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        {heading || 'How It Works'}
                    </h2>
                </FadeUp>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-5 '>
                    {HomePageHowItWorksStepData.map((step, index) => (
                        <FadeUp
                            key={index}
                            delay={index * 0.2}
                            className='flex flex-col gap-6'>
                            <div className='relative w-full h-[472px] rounded-[8px] overflow-hidden bg-gray-light mb-1'>
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    fill
                                    className='object-cover transition-transform duration-700 hover:scale-105'
                                    sizes='(max-width: 768px) 100vw, 33vw'
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <h3 className='headline-4 text-dark'>
                                    {step.title}
                                </h3>
                                <p className='text-description text-dark/70'>
                                    {step.description}
                                </p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

