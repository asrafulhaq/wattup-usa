'use client';

import { CardSlider } from '@/components/ui/card-slider';
import { SlidesCardData } from '@/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

function SlidesCard({ card }: { card: SlidesCardData }) {
    return (
        <div className='relative group rounded-[8px] overflow-hidden h-[520px] md:h-[489px] w-full flex flex-col items-start justify-end gap-[10px] p-[32px] pt-[276px] md:pt-[276px]'>
            <Image
                src={card.image}
                alt={card.title}
                fill
                sizes='(max-width: 767px) 330px, 785px'
                className={cn(
                    'object-cover  transition-transform duration-700 z-0'
                )}
            />
            {/* Gradient overlay for text readability */}
            <div className='absolute inset-0 bg-linear-to-t from-black/10 via-black/10 to-transparent pointer-events-none z-10' />

            <h3 className='relative z-20 headline-4 text-white'>
                {card.title}
            </h3>
            <p className='relative z-20 text-white/90 text-description max-w-[572px] '>
                {card.description}
            </p>
            <Link
                href={card.cta.href}
                className='relative  z-20 inline-flex px-[24px] py-[12px] bg-primary hover:bg-primary-hover text-white max-md:w-[282px] justify-center rounded-[8px] font-bold text-[16px] shadow-btn transition-transform hover:-translate-y-0.5 mt-2 leading-[130%] '>
                {card.cta.label}
            </Link>
        </div>
    );
}

export function CardSliderWrapper({ cards }: { cards: SlidesCardData[] }) {
    const slides = cards.map(card => ({
        id: card.id,
        content: <SlidesCard card={card} />,
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

