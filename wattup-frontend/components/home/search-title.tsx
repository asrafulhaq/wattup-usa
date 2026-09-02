'use client';

import { Reveal } from '@/components/reveal-animation';
import { usePathname, useSearchParams } from 'next/navigation';

export default function SearchTitle() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const query = searchParams.get('q');

    if (pathname !== '/search' || !query) return null;

    return (
        <Reveal delay={0.1} yOffset={10}>
            <div className='pt-8'>
                <h1 className='text-[24px] leading-[26px]  md:text-[32px] md:leading-[36px] tracking-[-1%]  font-medium md:font-bold text-text-muted'>
                    Results for <span className='text-primary'>{query}</span>
                </h1>
            </div>
        </Reveal>
    );
}

