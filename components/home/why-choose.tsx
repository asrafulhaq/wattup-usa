import { FadeUp } from '@/components/ui/fade-up';
import { HomePageWhyChooseSlideCardData, SlidesCardData } from '@/data';
import { cn } from '@/lib/utils';
import { CardSliderWrapper } from './built-for-slider';

export function WhyChoose({
    heading,
    slides,
    headingClass,
}: {
    heading?: React.ReactNode;
    slides?: SlidesCardData[];
    headingClass?: string;
}) {
    return (
        <section
            id='why-wattup'
            className='w-full  max-w-[1444px] mx-auto  overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto '>
                <FadeUp>
                    <h2
                        className={cn(
                            'headline-dark max-md:w-[205px] mb-5 md:mb-10',
                            headingClass
                        )}>
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

