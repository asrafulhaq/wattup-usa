/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getPaginatedArticles } from '@/app/_actions/postActions';
import { CardSlider } from '@/components/ui/card-slider';
import { FadeUp } from '@/components/ui/fade-up';
import { cn, formatDate, getReadTime } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Article = {
    id: string;
    title: string;
    content: string | null;
    slug: string | null;
    image?: string | null;
    imageAlt?: string | null;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date | null;
    featured: boolean;
    featuredImage: any;
    status: string;
    pinned: boolean;
};

function PressReleaseCard({
    item,
    isMobileSlider = false,
}: {
    item: Article;
    isMobileSlider?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex gap-6 group cursor-pointer w-full items-start',
                isMobileSlider ? 'flex-col' : 'flex-col md:flex-row md:gap-8'
            )}>
            {/* Image Container */}
            <div
                className={cn(
                    'relative w-full shrink-0 rounded-[8px] overflow-hidden bg-muted',
                    isMobileSlider ? 'h-[400px]' : 'h-[240px] md:w-[440px]'
                )}>
                {item.image ? (
                    <Image
                        src={item.image}
                        alt={item.imageAlt ?? item.title}
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-105'
                        sizes='(max-width: 768px) 100vw, 440px'
                    />
                ) : (
                    <div className='w-full h-full bg-muted flex items-center justify-center'>
                        <span className='text-muted-foreground text-sm'>
                            No image
                        </span>
                    </div>
                )}
            </div>

            <div className='content flex flex-col gap-3 md:gap-5 flex-1'>
                {/* Date & Read Time */}
                <p className='text-[16px] font-medium leading-[130%] tracking-[-0.03em] text-dark/70'>
                    {formatDate(item.publishedAt ?? item.createdAt)}
                    <span className='mx-2'>•</span>
                    {getReadTime(item.content ?? '')}
                </p>

                {/* Title & Description */}
                <div className='flex flex-col gap-3'>
                    <Link href={`/press-release/${item.slug ?? item.id}`}>
                        <h3 className='headline-5 text-dark'>{item.title}</h3>
                    </Link>
                    <p className='text-[16px] md:text-[20px] font-normal leading-[130%] text-dark/70 line-clamp-3'>
                        {(item.content ?? '').replace(/<[^>]*>/g, ' ').trim()}
                    </p>
                </div>

                <Link
                    href={`/press-release/${item.slug ?? item.id}`}
                    className='text-primary hover:text-primary-hover py-[10px] text-[16px] font-semibold flex items-center gap-2'>
                    Keep Reading
                </Link>
            </div>
        </div>
    );
}

export function PressReleaseListContent({
    initialArticles,
    initialHasNextPage,
}: {
    initialArticles: Article[];
    initialHasNextPage: boolean;
}) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
    const [isLoading, setIsLoading] = useState(false);

    const handleShowMore = async () => {
        if (isLoading) return;
        setIsLoading(true);
        const nextPage = page + 1;
        const result = await getPaginatedArticles(nextPage, 10);

        if (result.articles.length > 0) {
            setArticles([...articles, ...result.articles]);
            setPage(nextPage);
            setHasNextPage(result.hasNextPage);
        } else {
            setHasNextPage(false);
        }
        setIsLoading(false);
    };

    const mobileSlides = articles.map((item, index) => ({
        id: String(index),
        content: <PressReleaseCard item={item} isMobileSlider={true} />,
    }));

    return (
        <div className='container mx-auto flex flex-col'>
            {/* Header */}
            <h2 className='headline-dark max-md:w-[348px] mb-6'>
                Our main news
            </h2>
            <FadeUp>
                <p className='text-[16px] md:text-[20px] font-normal max-w-[670px] leading-[130%] md:leading-[120%] text-dark md:text-dark/70 mb-5 md:mb-[56px]'>
                    All the most important news about{' '}
                    <br className='md:hidden' /> WattupUSA
                </p>
            </FadeUp>

            {/* Desktop List View */}
            <div className='hidden md:flex flex-col gap-12'>
                {articles.map((item, index) => (
                    <FadeUp key={item.id} delay={index * 0.05}>
                        <PressReleaseCard item={item} />
                    </FadeUp>
                ))}
            </div>

            {/* Mobile Slider View */}
            <div className='block md:hidden'>
                <FadeUp>
                    <CardSlider
                        slides={mobileSlides}
                        mobilePerView={1}
                        gap={16}
                        showArrows={false}
                        showDots={true}
                        loop={false}
                    />
                </FadeUp>
            </div>

            {/* Show More Button */}
            {hasNextPage && (
                <div className='flex justify-center mt-12 md:mt-16'>
                    <button
                        onClick={handleShowMore}
                        disabled={isLoading}
                        className='flex border rounded-[8px] justify-center items-center border-border text-dark/70 hover:bg-primary transition-colors duration-300 hover:text-white gap-2 py-3 px-10 text-[18px] font-semibold disabled:opacity-50'>
                        {isLoading ? 'Loading...' : 'Show More'}
                    </button>
                </div>
            )}
        </div>
    );
}

