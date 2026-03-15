import { FadeUp } from '@/components/ui/fade-up';
import { HomePageBuiltForSlidesCardData } from '@/data';
import { CardSliderWrapper } from './built-for-slider';

export function BuiltFor() {
    return (
        <section className='w-full max-w-[1440px] mx-auto  overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto '>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        Built for Drivers and Property Owners
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <CardSliderWrapper cards={HomePageBuiltForSlidesCardData} />
                </FadeUp>
            </div>
        </section>
    );
}

