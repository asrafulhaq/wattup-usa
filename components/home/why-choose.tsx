import { FadeUp } from '@/components/ui/fade-up';
import { HomePageWhyChooseSlideCardData, SlidesCardData } from '@/data';
import { CardSliderWrapper } from './built-for-slider';

export function WhyChoose({
    heading,
    slides,
}: {
    heading?: React.ReactNode;
    slides?: SlidesCardData[];
}) {
    return (
        <section className='w-full  max-w-[1444px] mx-auto  overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto '>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        {heading || 'Why Choose WattUp'}
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <CardSliderWrapper
                        cards={slides || HomePageWhyChooseSlideCardData}
                    />
                </FadeUp>
            </div>
        </section>
    );
}

