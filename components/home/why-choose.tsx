import Image from 'next/image';
import { FadeUp } from '@/components/ui/fade-up';

export function WhyChoose() {
    return (
        <section className="w-full py-24 bg-white overflow-hidden relative">
            <div className="container">
                <FadeUp>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-dark mb-12">
                        Why Choose WattUp
                    </h2>
                </FadeUp>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Fast Charging */}
                    <FadeUp delay={0.1} className="relative group rounded-xl overflow-hidden h-[400px]">
                        <Image
                            src="/assets/images/car-4.png"
                            alt="Fast Charging"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <h3 className="text-2xl font-bold text-white mb-3">Fast Charging</h3>
                            <p className="text-white/90 font-medium mb-6">
                                Provide top-tier charging speeds for drivers on the go.
                            </p>
                        </div>
                    </FadeUp>

                    {/* Premium Locations */}
                    <FadeUp delay={0.3} className="relative group rounded-xl overflow-hidden h-[400px]">
                        <Image
                            src="/assets/images/car-5.png"
                            alt="Premium Locations"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <h3 className="text-2xl font-bold text-white mb-3">Premium Locations</h3>
                            <p className="text-white/90 font-medium mb-6">
                                Accessible chargers positioned at premier real estate locations.
                            </p>
                        </div>
                    </FadeUp>
                </div>
                
                <div className="flex gap-2 mt-8">
                    <span className="w-2.5 h-2.5 rounded-full bg-dark"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray"></span>
                </div>
            </div>
        </section>
    );
}
