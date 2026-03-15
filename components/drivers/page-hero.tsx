import { FadeUp } from '@/components/ui/fade-up';
import Image from 'next/image';
import Link from 'next/link';

export function PageHero({
    image,
    alt,
    heading,
    subHeading,
    buttonText,
    buttonLink,
}: {
    image: string;
    alt?: string;
    heading: React.ReactNode;
    subHeading: React.ReactNode;
    buttonText: string;
    buttonLink: string;
}) {
    return (
        <section className='relative overflow-x-hidden mx-auto w-full h-dvh lg:h-auto lg:aspect-1440/951 max-h-[951px] flex flex-col items-center justify-start pt-[116px] overflow-hidden'>
            {/* Background Image Setup */}
            <div className='absolute inset-0 z-0 select-none'>
                <Image
                    src={image || '/assets/images/for-driver-page-hero.png'}
                    alt={alt || 'Page Hero Background'}
                    fill
                    className='object-cover object-center'
                    priority
                    draggable={false}
                />
                {/* Subtle Gradient Overlay for Text Readability */}
                {/*     <div className='absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent' /> */}
            </div>

            {/* Content Container */}
            <div className='relative z-10 container mx-auto flex flex-col items-center text-center text-white'>
                <FadeUp yOffset={30}>
                    <h1 className='headline mb-5 text-white'>
                        {heading || 'EV Charging Made Simple'}
                    </h1>
                </FadeUp>

                <FadeUp delay={0.2} yOffset={20}>
                    <p className='text-lg md:text-[20px] font-normal max-w-[416px] mx-auto mb-8 leading-[120%] text-white'>
                        {subHeading || (
                            <>
                                Fast, reliable charging stations located
                                <br className='hidden sm:block' />
                                where you live, work, and travel.
                            </>
                        )}
                    </p>
                </FadeUp>

                <FadeUp
                    delay={0.4}
                    yOffset={20}
                    className='w-full flex-col font-sans'>
                    <div className='flex items-center justify-center '>
                        <Link
                            href={buttonLink || '/find-charger'}
                            className='w-full sm:w-[210px] flex items-center justify-center px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-medium text-[16px] leading-[130%] tracking-[-0.03em] transition-transform hover:-translate-y-0.5 shadow-btn whitespace-nowrap'>
                            {buttonText || 'Find a Charger'}
                        </Link>
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

export default PageHero;

