import { FadeUp } from '@/components/ui/fade-up';
import { ImageCardSlider } from '@/components/ui/image-card-slider';
import { HomePageBuiltForSlidesCardData } from '@/data';

export function BuiltFor({
    cardHeadingClass,
    cardDescriptionClass,
}: {
    cardHeadingClass?: string;
    cardDescriptionClass?: string;
}) {
    return (
        <section className='w-full max-w-[1444px] mx-auto  overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto '>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        Built for Drivers and Property Owners
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <ImageCardSlider
                        cardHeadingClass={cardHeadingClass}
                        cardDescriptionClass={cardDescriptionClass}
                        cards={HomePageBuiltForSlidesCardData}
                    />
                </FadeUp>
            </div>
        </section>
    );
}

