'use client';

import { CardSlider } from '@/components/ui/card-slider';
import { WattupButton } from '@/components/ui/wattup-button';
import { SlidesCardData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * ImageOverlayCard — full-bleed image card with text + CTA overlaid on the image.
 *
 * Internal card used by ImageCardSlider.
 *
 * Replaces: `SlidesCard` in home/built-for-slider.tsx
 */
function ImageOverlayCard({
    card,
    cardHeadingClass,
    cardDescriptionClass,
}: {
    card: SlidesCardData;
    cardHeadingClass?: string;
    cardDescriptionClass?: string;
}) {
    return (
        <div className='relative group rounded-[8px] overflow-hidden h-[520px] md:h-[489px] w-full flex flex-col items-start justify-end gap-[10px] py-8 px-6 pt-[276px] md:pt-[276px] text-left'>
            {card?.mobileImage && (
                <Image
                    src={card.mobileImage}
                    alt='Image card'
                    fill
                    sizes='(max-width: 767px) 330px, 785px'
                    className={cn(
                        'object-cover max-md:block hidden transition-transform duration-700 z-0',
                        card?.imageClass
                    )}
                />
            )}
            <Image
                src={card.image}
                alt='Image card'
                fill
                sizes='(max-width: 767px) 330px, 785px'
                className={cn(
                    'object-cover transition-transform duration-700 z-0',
                    card?.imageClass,
                    card?.mobileImage && 'max-md:hidden'
                )}
            />
            {/* Gradient overlay for text readability */}
            <div className='absolute inset-0 bg-linear-to-t from-black/10 via-black/10 to-transparent pointer-events-none z-10' />

            <h3
                className={cn(
                    'relative z-20 min-w-[282px] headline-4 text-white',
                    cardHeadingClass
                )}>
                {card.title}
            </h3>
            <p
                className={cn(
                    'relative z-20 text-white/90 text-[20px] font-semibold leading-[130%] tracking-[-3%] max-md:max-w-[282px] max-w-[572px]',
                    cardDescriptionClass
                )}>
                {card.description}
            </p>
            <WattupButton
                href={card.cta.href}
                size='sm'
                className='relative z-20 mt-2'>
                {card.cta.label}
            </WattupButton>
        </div>
    );
}

/**
 * ImageCardSlider — horizontal slider of full-bleed image cards with text/CTA overlay.
 *
 * ### Usage
 * ```tsx
 * <ImageCardSlider cards={HomePageWhyChooseSlideCardData} />
 * <ImageCardSlider cards={DriverPageWhyChooseSlideCardData} cardHeadingClass='text-3xl' />
 * ```
 *
 * Replaces: `CardSliderWrapper` in home/built-for-slider.tsx
 */
export function ImageCardSlider({
    cards,
    cardHeadingClass,
    cardDescriptionClass,
}: {
    cards: SlidesCardData[];
    cardHeadingClass?: string;
    cardDescriptionClass?: string;
}) {
    const slides = cards.map(card => ({
        id: card.id,
        content: (
            <ImageOverlayCard
                cardHeadingClass={cardHeadingClass}
                cardDescriptionClass={cardDescriptionClass}
                card={card}
            />
        ),
    }));

    return (
        <CardSlider
            slides={slides}
            slidesPerView={2}
            mobilePerView={1.05}
            desktopPerView={1.8}
            gap={20}
            showArrows={true}
            showDots={true}
        />
    );
}
