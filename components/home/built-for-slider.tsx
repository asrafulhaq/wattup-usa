'use client';

import { CardSlider } from '@/components/ui/card-slider';
import Image from 'next/image';
import Link from 'next/link';
import type { BuiltForCardData } from './built-for';

function BuiltForCard({ card }: { card: BuiltForCardData }) {
    return (
        <div className='relative group rounded-[8px] overflow-hidden h-[400px] md:h-[489px]'>
            <Image
                src={card.image}
                alt={card.title}
                fill
                className='object-cover transition-transform duration-700 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
            />
            {/* Gradient overlay for text readability */}
            <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent' />

            <div className='absolute bottom-0 left-0 p-8 w-full'>
                <h3 className='text-[32px] font-semibold tracking-[-0.03em] leading-[110%] text-white mb-3'>
                    {card.title}
                </h3>
                <p className='text-white/90 text-[16px] leading-[150%] mb-6 max-w-md'>
                    {card.description}
                </p>
                <Link
                    href={card.cta.href}
                    className='inline-flex px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-medium text-[16px] shadow-btn transition-transform hover:-translate-y-0.5'>
                    {card.cta.label}
                </Link>
            </div>
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

