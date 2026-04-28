import { FadeUp } from '@/components/ui/fade-up';
import { ImageCardSlider } from '@/components/ui/image-card-slider';
import { HomePageWhyChooseSlideCardData, SlidesCardData } from '@/data';
import { cn } from '@/lib/utils';

/**
 * ImageSliderSection — section with a heading above an ImageCardSlider.
 *
 * ### Usage
 * ```tsx
 * // Home — "Why Choose WattUp"
 * <ImageSliderSection heading='Why Choose WattUp' slides={HomePageWhyChooseSlideCardData} />
 *
 * // Drivers — "Why WattUp"
 * <ImageSliderSection slides={DriverPageWhyChooseSlideCardData} />
 *
 * // Hosts — custom heading + class
 * <ImageSliderSection
 *     heading='Built For Hosts'
 *     slides={HostPageWhyChooseSlideCardData}
 *     headingClass='max-w-[460px]'
 * />
 * ```
 *
 * Replaces: `WhyChoose` in home/why-choose.tsx
 */
export function ImageSliderSection({
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
            className='w-full max-w-[1444px] mx-auto overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto'>
                <FadeUp>
                    <h2
                        className={cn(
                            'headline-dark max-md:w-[348px] mb-5 md:mb-10',
                            headingClass
                        )}>
                        {heading || 'Why Choose WattUp'}
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <ImageCardSlider
                        cards={slides || HomePageWhyChooseSlideCardData}
                    />
                </FadeUp>
            </div>
        </section>
    );
}
