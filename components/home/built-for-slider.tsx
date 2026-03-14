'use client';

import { CardSlider } from '@/components/ui/card-slider';
import Image from 'next/image';
import Link from 'next/link';
import type { BuiltForCardData } from './built-for';

function BuiltForCard({ card }: { card: BuiltForCardData }) {
    return (
        <div className='relative group rounded-[8px] overflow-hidden h-[400px] md:h-[489px] flex flex-col items-start justify-end gap-[10px] p-[32px] md:pt-[276px]'>
            <Image
                src={card.image}
                alt={card.title}
                fill
                className='object-cover transition-transform duration-700 group-hover:scale-105 z-0'
                sizes='(max-width: 768px) 100vw, 50vw'
            />
            {/* Gradient overlay for text readability */}
            <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10' />

            <h3 className='relative z-20 text-[32px] font-semibold tracking-[-0.03em] leading-[110%] text-white'>
                {card.title}
            </h3>
            <p className='relative z-20 text-white/90 text-[16px] leading-[150%] max-w-md'>
                {card.description}
            </p>
            <Link
                href={card.cta.href}
                className='relative z-20 inline-flex px-[16px] py-[10px] bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-[4px] font-medium text-[14px] shadow-btn transition-transform hover:-translate-y-0.5 mt-1'>
                {card.cta.label}
            </Link>
        </div>
    );
}

export function CardSliderWrapper({ cards }: { cards: BuiltForCardData[] }) {
    const slides = cards.map(card => ({
        id: card.id,
        content: <BuiltForCard card={card} />,
    }));

    return (
        <CardSlider
            slides={slides}
            slidesPerView={1.5}
            gap={20}
            showArrows={true}
            showDots={true}
        />
    );
}

