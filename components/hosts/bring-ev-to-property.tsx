import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import { hostsImageUrls } from '@/lib/images/hosts';
import Link from 'next/link';

export function BringEvToProperty() {
    return (
        <div className='pt-[82px]'>
            {' '}
            <FadedImageCrossSection
                imageSrc={hostsImageUrls.hostCrossfade}
                imageSrcMobile={hostsImageUrls.hostCrossfadeMobile}
                imageAlt='Charging Stations By Water'
                sectionClass='max-md:pt-[82px] max-md:mb-[0px]'
                topFaddingStyle={{
                    background:
                        'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 30%)',
                }}>
                <div className='flex flex-col items-center text-center w-full'>
                    <FadeUp>
                        <h2 className='headline-dark mb-[16px] md:mb-[24px] max-md:w-[290px]'>
                            {' '}
                            Bring EV Charging to Your{' '}
                            <br className='hidden md:block' /> Property
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2} yOffset={20}>
                        <p className='text-description text-[20px] font-normal! mb-[24px] md:mb-[32px]'>
                            Explore the WattUp charging network.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.2} className='relative z-20'>
                        <Link
                            href='/contact#contact-us'
                            className='inline-flex max-md:w-[348px] justify-center h-[53px] px-[28px] py-4 bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] transition-colors duration-500 mb-8'>
                            Request Partnership
                        </Link>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

