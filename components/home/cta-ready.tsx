import { FadeUp } from '@/components/ui/fade-up';
import Image from 'next/image';
import Link from 'next/link';

export function CTAReady() {
    return (
        <section className='relative w-full overflow-hidden text-white  mx-auto'>
            {/* Top CTA Banner - 1440x960px Figma Specs */}
            <div className='relative w-full bg-black h-[960px] flex flex-col items-center justify-start  mx-auto'>
                {/* Background Image Setup */}
                <div className='absolute inset-0 z-0 select-none'>
                    <Image
                        src='/assets/images/footer-section-bg.png'
                        alt='WattUp Sunset Background'
                        fill
                        className='object-cover object-center'
                        priority
                        draggable={false}
                    />
                    {/* Dark gradient overlay to match Figma contrast if needed, or just light darkening for text readability */}
                    <div className='absolute inset-0 bg-black/20' />
                </div>
                <div className='container mx-auto overflow-x-hidden'>
                    <div className='relative z-10 w-full flex flex-col items-center text-center text-white pt-[218px]'>
                        <FadeUp>
                            <h2 className='headline-white pb-6'>
                                Ready to Charge
                                <br />
                                with WattUp?
                            </h2>
                        </FadeUp>

                        <FadeUp delay={0.2}>
                            <p className='text-lg md:text-[20px] font-normal max-w-[424px] mx-auto mb-8 leading-[120%]  text-white'>
                                Find a charging station near you or partner
                                <br className='hidden md:block' />
                                with us to bring EV charging to your property.
                            </p>
                        </FadeUp>

                        <FadeUp
                            delay={0.4}
                            className='flex flex-col sm:flex-row items-center justify-center gap-[12px] w-full'>
                            <Link
                                href='/find-charger'
                                className='w-full sm:w-[210px] h-[56px] flex items-center justify-center bg-white text-dark hover:bg-gray-light rounded-[8px] font-bold text-[16px] shadow-btn transition-transform whitespace-nowrap'>
                                Find a Charger
                            </Link>
                            <Link
                                href='/partner'
                                className='w-full sm:w-[210px] h-[56px] flex items-center justify-center bg-white text-dark hover:bg-gray-light rounded-[8px] font-bold text-[16px] shadow-btn transition-transform whitespace-nowrap'>
                                Partner With Us
                            </Link>
                        </FadeUp>
                    </div>
                </div>
            </div>
        </section>
    );
}

