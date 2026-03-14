import { FadeUp } from '@/components/ui/fade-up';
import Image from 'next/image';

const steps = [
    {
        title: 'Find a Station',
        description:
            'Locate a WattUp charging station near you using our network map.',
        image: '/assets/images/how-it-works-1.png',
    },
    {
        title: 'Plug In',
        description:
            'Check in with our app, plug in your vehicle, and start charging.',
        image: '/assets/images/how-it-works-2.png',
    },
    {
        title: 'Charge & Go',
        description:
            'Receive real-time updates and pay seamlessly when your charge is complete.',
        image: '/assets/images/how-it-works-3.png',
    },
];

export function HowItWorks() {
    return (
        <section className='w-full common-section-padding bg-white overflow-hidden'>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>How It Works</h2>
                </FadeUp>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-5 '>
                    {steps.map((step, index) => (
                        <FadeUp
                            key={index}
                            delay={index * 0.2}
                            className='flex flex-col gap-6'>
                            <div className='relative w-full h-[472px] w-[440px] rounded-[8px] overflow-hidden bg-gray-light mb-1'>
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
                                <p className='text-[20px] font-semibold leading-[130%] tracking-[-3%] text-dark/70'>
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

