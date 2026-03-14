import Image from 'next/image';
import { FadeUp } from '@/components/ui/fade-up';

const steps = [
    {
        title: 'Find a Station',
        description: 'Locate a WattUp charging station near you using our network map.',
        image: '/assets/images/card-image-1.png'
    },
    {
        title: 'Plug In',
        description: 'Check in with our app, plug in your vehicle, and start charging.',
        image: '/assets/images/card-image-2.png'
    },
    {
        title: 'Charge & Go',
        description: 'Receive real-time updates and pay seamlessly when your charge is complete.',
        image: '/assets/images/card-image-3.png'
    }
];

export function HowItWorks() {
    return (
        <section className="w-full py-24 bg-white overflow-hidden">
            <div className="container">
                <FadeUp>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-dark mb-16 text-center lg:text-left">
                        How It Works
                    </h2>
                </FadeUp>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((step, index) => (
                        <FadeUp key={index} delay={index * 0.2} className="flex flex-col gap-6">
                            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-gray-light">
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    fill
                                    className="object-cover transition-transform duration-700 hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl md:text-3xl font-bold text-dark">
                                    {step.title}
                                </h3>
                                <p className="text-lg font-medium text-dark/70">
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
