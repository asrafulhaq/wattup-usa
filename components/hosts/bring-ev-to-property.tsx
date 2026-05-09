import { FadeUp } from '@/components/ui/fade-up';
import { FadedImageCrossSection } from '@/components/ui/faded-image-cross-section';
import { WattupButton } from '@/components/ui/wattup-button';
import { hostsImageUrls } from '@/lib/images/hosts';

export function BringEvToProperty() {
    return (
        <div className='pt-[82px]'>
            {' '}
            <FadedImageCrossSection
                imageSrc={hostsImageUrls.hostCrossfade}
                imageAlt='Charging Stations By Water'
                sectionClass='max-md:pt-[82px] max-md:mb-[0px]'>
                <div className='flex flex-col py-14 items-center text-center w-full'>
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
                        <WattupButton
                            href='/contact#contact-us'
                            className='max-md:w-[348px] mb-8'>
                            Request Partnership
                        </WattupButton>
                    </FadeUp>
                </div>
            </FadedImageCrossSection>
        </div>
    );
}

