import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import Link from 'next/link';

export function BringEvToProperty() {
    return (
        <div className='pt-[82px]'>
            {' '}
            <FadedImageCrossSection
                imageSrc='/assets/images/host-crossfade.png'
                imageAlt='Charging Stations By Water'
                bottomGradient={false}
                topFaddingStyle={{
                    background:
                        'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 0%)',
                }}>
                <div className='flex flex-col items-center text-center w-full'>
                    <FadeUp>
                        <h2 className='headline-dark mb-[24px]'>
                            {' '}
                            Bring EV Charging to Your{' '}
                            <br className='hidden sm:block' /> Property
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2} yOffset={20}>
                        <p className='text-description text-[20px] font-normal! mb-[32px]'>
                            Explore the WattUp charging network.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.2} className='relative z-20'>
                        <Link
                            href='/contact'
                            className='inline-flex h-[53px] px-[28px] py-4 bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] transition-all duration-300 mb-8'>
                            Request Partnership
                        </Link>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

