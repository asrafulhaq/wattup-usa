'use client';

import { CancelIcon, PlusIcon } from '@/components/icons/icons';
import { FadeUp } from '@/components/ui/fade-up';
import { GroupedFAQData } from '@/data';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export const FAQGrouped = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(
        GroupedFAQData[0]?.category || ''
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [openStates, setOpenStates] = useState<{ [key: string]: number[] }>(
        GroupedFAQData.reduce(
            (acc, cat) => ({ ...acc, [cat.category]: [] }),
            {}
        )
    );

    // Filter logic
    const filteredData = GroupedFAQData.map(categoryGroup => {
        const filteredItems = categoryGroup.items.filter(
            item =>
                item.question
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...categoryGroup, items: filteredItems };
    }).filter(cat => cat.items.length > 0);

    // Track active category on scroll
    useEffect(() => {
        const handleScroll = () => {
            const offsets = GroupedFAQData.map(cat => {
                const element = document.getElementById(
                    cat.category.replace(/\s+/g, '-').toLowerCase()
                );
                if (element) {
                    return {
                        category: cat.category,
                        offset: element.getBoundingClientRect().top,
                    };
                }
                return null;
            }).filter(Boolean);

            const active =
                offsets?.find(o => o!.offset <= 150 && o!.offset > -50) ||
                offsets?.reverse().find(o => o!.offset <= 150);

            if (active) setActiveCategory(active.category);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper to fix the above logic (acc was undefined in the shorthand)
    const toggleFaqProper = (category: string, index: number) => {
        setOpenStates(prev => {
            const current = prev[category];
            const isClosing = current.includes(index);
            return {
                ...prev,
                [category]: isClosing
                    ? current.filter(i => i !== index)
                    : [...current, index],
            };
        });
    };

    const toggleAllInCategory = (category: string, showAll: boolean) => {
        const catData = GroupedFAQData.find(c => c.category === category);
        if (!catData) return;

        setOpenStates(prev => ({
            ...prev,
            [category]: showAll ? catData.items.map((_, i) => i) : [],
        }));
    }; 

    return (
        <section className='w-full bg-white py-[82px]'>
            <div className='container max-w-[1440px] mx-auto flex flex-col md:flex-row items-start gap-10 md:gap-[130px]'>
                {/* Sidebar - In this article (Desktop) */}
                <aside className='hidden md:block w-[297px] shrink-0 sticky top-[50px] h-fit'>
                    <h3 className='text-[24px] font-semibold leading-none text-dark tracking-[-0.03em] mt-0'>
                        In this article:
                    </h3>

                    <ul className='flex flex-col gap-4 mt-8'>
                        {filteredData.map(cat => (
                            <li key={cat.category}>
                                <button
                                    onClick={() => {
                                        const element = document.getElementById(
                                            cat.category
                                                .replace(/\s+/g, '-')
                                                .toLowerCase()
                                        );
                                        if (element) {
                                            const yOffset = -120;
                                            const y =
                                                element.getBoundingClientRect()
                                                    .top +
                                                window.pageYOffset +
                                                yOffset;
                                            window.scrollTo({
                                                top: y,
                                                behavior: 'smooth',
                                            });
                                        }
                                    }}
                                    className={cn(
                                        'text-[16px] font-normal leading-[120%] transition-colors text-left',
                                        activeCategory === cat.category
                                            ? 'text-dark font-semibold'
                                            : 'text-dark/70 hover:text-dark'
                                    )}>
                                    {cat.category}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className='flex flex-col flex-none w-full md:w-[670px] md:min-w-[670px]'>
                    <FadeUp className='w-full'>
                        <h2 className=' text-[32px] font-semibold md:text-[40px] md:font-medium text-dark mb-4 md:mb-6 leading-none mt-0'>
                            Frequently Asked Questions
                        </h2>
                        <p className='text-description text-dark md:text-dark/70 mb-10 md:mb-[82px] font-normal! mt-4'>
                            If you don’t find the answer to your question here,
                            just write to us.
                        </p>
                    </FadeUp>
                    {/* Mobile Article Menu Dropdown */}
                    <div className='md:hidden w-full relative mb-10'>
                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className='flex items-center justify-start gap-3 w-full py-4 border-b border-dark/10 text-[16px] font-semibold text-dark'>
                            <span>Article menu</span>
                            <svg
                                className={cn(
                                    'w-5 h-5 transition-transform duration-300',
                                    isMobileMenuOpen ? 'rotate-180' : ''
                                )}
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'>
                                <polyline points='6 9 12 15 18 9' />
                            </svg>
                        </button>

                        {isMobileMenuOpen && (
                            <div className='bg-white mt-4 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2'>
                                {/* Search Bar */}
                                <div className='relative w-full h-[48px] bg-dark/5 rounded-[8px] flex items-center px-4'>
                                    <svg
                                        className='w-5 h-5 text-dark/70 mr-3'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'>
                                        <circle cx='11' cy='11' r='8' />
                                        <line
                                            x1='21'
                                            y1='21'
                                            x2='16.65'
                                            y2='16.65'
                                        />
                                    </svg>
                                    <input
                                        type='text'
                                        placeholder='Search'
                                        value={searchQuery}
                                        onChange={e =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className='bg-transparent border-none outline-none w-full text-[16px] text-dark placeholder:text-dark/40'
                                    />
                                </div>

                                <div className='flex flex-col gap-4'>
                                    <h4 className='text-[20px] font-bold text-dark'>
                                        In this article:
                                    </h4>
                                    <ul className='flex flex-col gap-4'>
                                        {filteredData.map(cat => (
                                            <li key={cat.category}>
                                                <button
                                                    onClick={() => {
                                                        const element =
                                                            document.getElementById(
                                                                cat.category
                                                                    .replace(
                                                                        /\s+/g,
                                                                        '-'
                                                                    )
                                                                    .toLowerCase()
                                                            );
                                                        if (element) {
                                                            const yOffset =
                                                                -120;
                                                            const y =
                                                                element.getBoundingClientRect()
                                                                    .top +
                                                                window.pageYOffset +
                                                                yOffset;
                                                            window.scrollTo({
                                                                top: y,
                                                                behavior:
                                                                    'smooth',
                                                            });
                                                        }
                                                        setIsMobileMenuOpen(
                                                            false
                                                        );
                                                    }}
                                                    className='text-[16px] font-normal text-dark/70 hover:text-dark transition-colors text-left'>
                                                    {cat.category}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className='flex flex-col gap-[64px]'>
                        {filteredData.map(categoryGroup => {
                            const isAllOpen =
                                openStates[categoryGroup.category]?.length ===
                                categoryGroup.items.length;

                            return (
                                <div
                                    key={categoryGroup.category}
                                    id={categoryGroup.category
                                        .replace(/\s+/g, '-')
                                        .toLowerCase()}
                                    className='flex flex-col'>
                                    <div className='flex items-center justify-start gap-4 mb-8'>
                                        <h3 className='headline-5 max-md:font-semibold!  text-dark'>
                                            {categoryGroup.category}
                                        </h3>
                                        <button
                                            onClick={() =>
                                                toggleAllInCategory(
                                                    categoryGroup.category,
                                                    !isAllOpen
                                                )
                                            }
                                            className='text-[16px] font-semibold text-primary hover:text-primary-hover transition-colors'>
                                            {isAllOpen
                                                ? 'Hide All'
                                                : 'Show All'}
                                        </button>
                                    </div>

                                    <div className='flex flex-col border-t border-dark/20'>
                                        {categoryGroup.items.map(
                                            (item, itemIndex) => {
                                                const isOpen =
                                                    openStates[
                                                        categoryGroup.category
                                                    ].includes(itemIndex);
                                                return (
                                                    <div
                                                        key={itemIndex}
                                                        className={cn(
                                                            'flex flex-col border-b border-dark/20 w-full overflow-hidden transition-all duration-500',
                                                            isOpen
                                                                ? 'pb-6'
                                                                : 'pb-0'
                                                        )}>
                                                        <button
                                                            onClick={() =>
                                                                toggleFaqProper(
                                                                    categoryGroup.category,
                                                                    itemIndex
                                                                )
                                                            }
                                                            className='flex items-center justify-between w-full py-6 group text-left'>
                                                            <span className='text-[20px] md:text-[24px] leading-[100%] tracking-[-0.03em] font-semibold md:font-medium text-dark pr-4'>
                                                                {item.question}
                                                            </span>
                                                            <div className='relative shrink-0 w-6 h-6 rounded-full bg-dark flex items-center justify-center transition-colors hover:bg-dark/80'>
                                                                <PlusIcon
                                                                    className={cn(
                                                                        'absolute w-3 h-3 transition-all duration-500',
                                                                        isOpen
                                                                            ? 'opacity-0 rotate-90'
                                                                            : 'opacity-100 rotate-0'
                                                                    )}
                                                                />
                                                                <CancelIcon
                                                                    stroke='#fff'
                                                                    className={cn(
                                                                        'absolute w-[10px] h-[10px] transition-all duration-500',
                                                                        isOpen
                                                                            ? 'opacity-100 rotate-0'
                                                                            : 'opacity-0 -rotate-90'
                                                                    )}
                                                                />
                                                            </div>
                                                        </button>

                                                        <div
                                                            className={cn(
                                                                'grid transition-all duration-500 ease-in-out',
                                                                isOpen
                                                                    ? 'grid-rows-[1fr] opacity-100'
                                                                    : 'grid-rows-[0fr] opacity-0'
                                                            )}>
                                                            <div className='overflow-hidden'>
                                                                <p className='text-[20px] leading-[130%] font-normal text-dark pt-2'>
                                                                    {
                                                                        item.answer
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Spacer to match Figma right side 270px if needed, though container + gap + flex-1 handle it */}
                <div className='hidden xl:block w-[270px] shrink-0' />
            </div>
        </section>
    );
};

export default FAQGrouped;

