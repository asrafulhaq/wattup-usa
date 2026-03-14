import Image from 'next/image';
import Link from 'next/link';
import { FadeUp } from '@/components/ui/fade-up';

const cities = ['Los Angeles', 'San Diego', 'Austin', 'Miami', 'And more'];

export function ExpandingUs() {
    return (
        <section className="relative w-full bg-white overflow-hidden py-24 border-y border-gray-light">
            <div className="container">
                <div className="flex flex-col items-center text-center">
                    <FadeUp>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-dark mb-12">
                            Expanding Across the U.S.
                        </h2>
                    </FadeUp>

                    <FadeUp delay={0.1} className="w-full overflow-hidden">
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-16 text-xl md:text-3xl font-bold text-gray mb-16 px-4">
                            {cities.map((city, idx) => (
                                <span key={idx} className={`whitespace-nowrap ${idx === 1 ? 'text-dark' : 'text-gray/50 hover:text-dark transition-colors cursor-pointer'}`}>
                                    {city}
                                </span>
                            ))}
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.2}>
                        <Link 
                            href="/locations"
                            className="inline-flex px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-sm shadow-btn transition-transform hover:-translate-y-0.5 mb-24"
                        >
                            View All Locations
                        </Link>
                    </FadeUp>
                </div>

                <FadeUp delay={0.4} className="relative w-full h-[300px] md:h-[600px] rounded-2xl overflow-hidden mt-8">
                     <Image 
                        src="/assets/images/section-bg-1.png"
                        alt="Charging Stations By Water"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 90vw"
                     />
                     {/* Gradient to smooth out the bottom if needed */}
                     <div className="absolute bottom-0 w-full h-1/3 bg-linear-to-t from-white/20 to-transparent" />
                </FadeUp>
            </div>
        </section>
    );
}
