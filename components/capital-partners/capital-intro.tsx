import { FadeUp } from '@/components/ui/fade-up';
import { WattupButton } from '@/components/ui/wattup-button';

export function CapitalIntro() {
    return (
        <section className='w-full common-section-padding'>
            <div className='container mx-auto'>
                {/* Desktop: two-column split */}
                <div className='flex flex-col md:flex-row items-center justify-center md:items-start max-md:text-center gap-8'>
                    {/* Left — headline (~55% width) */}
                    <FadeUp className='max-w-[644px]'>
                        <h1 className='headline-dark'>
                            Building the Infrastructure Behind EV Adoption
                        </h1>
                    </FadeUp>

                    {/* Right — description + CTA */}
                    <FadeUp
                        delay={0.15}
                        className='flex max-w-[670px] flex-col gap-6 md:gap-8 flex-1 pt-1'>
                        <div className='flex flex-col gap-2 md:gap-3'>
                            <p className='text-[16px] font-normal! md:text-[20px] leading-[130%]  md:text-dark/70'>
                                WattUp USA is developing a scalable network of
                                EV charging infrastructure designed for
                                high-traffic commercial environments across the
                                United States.
                            </p>
                            <p className='text-[16px] font-normal text-dark/50 md:text-dark/70 leading-[110%] tracking-[-3%]'>
                                Focused on execution, capital efficiency, and
                                long-term network value.
                            </p>
                        </div>

                        <WattupButton
                            href='/contact#contact-us'
                            className='max-md: w-full md:w-[247px]'>
                            Request Investor Access
                        </WattupButton>
                    </FadeUp>
                </div>
            </div>
        </section>
    );
}

