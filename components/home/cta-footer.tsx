import Image from 'next/image';
import Link from 'next/link';
import { FadeUp } from '@/components/ui/fade-up';

export function CtaFooter() {
    return (
        <footer className="relative w-full overflow-hidden bg-black text-white">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/assets/images/footer-section-bg.png"
                    alt="WattUp Footer Sunset"
                    fill
                    className="object-cover object-bottom"
                    priority={false}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 container pt-32 pb-12 w-full">
                <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto mb-24">
                    <FadeUp>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                            Ready to Charge <br />
                            with WattUp?
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="text-lg md:text-xl font-medium text-gray-light/80 mb-10">
                            Find a station or become a partner today.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.4} className="w-full flex-col font-jakarta">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/find-charger"
                                className="w-full sm:w-auto px-8 py-3.5 bg-white text-dark hover:bg-gray rounded-lg font-bold text-[16px] shadow-btn transition-transform hover:-translate-y-0.5"
                            >
                                Find a Charger
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-white/50 hover:border-white text-white rounded-lg font-bold text-[16px] transition-transform hover:-translate-y-0.5"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </FadeUp>
                </div>

                {/* Footer Bottom Setup */}
                <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="max-w-[150px] relative h-6 w-[150px]">
                        <Image
                            src="/assets/images/logo.png"
                            alt="WattUp Logo"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Column 1 */}
                        <div className="flex flex-col gap-3">
                             <Link href="/" className="text-sm text-gray-light/60 hover:text-white transition-colors">Home</Link>
                             <Link href="/for-drivers" className="text-sm text-gray-light/60 hover:text-white transition-colors">For Drivers</Link>
                             <Link href="/for-hosts" className="text-sm text-gray-light/60 hover:text-white transition-colors">For Hosts</Link>
                        </div>
                        {/* Column 2 */}
                        <div className="flex flex-col gap-3">
                             <Link href="/locations" className="text-sm text-gray-light/60 hover:text-white transition-colors">Locations</Link>
                             <Link href="/about" className="text-sm text-gray-light/60 hover:text-white transition-colors">About</Link>
                             <Link href="/contact" className="text-sm text-gray-light/60 hover:text-white transition-colors">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
