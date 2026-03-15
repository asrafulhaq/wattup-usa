'use client';
import { CancelIcon, PlusIcon } from '@/components/icons/icons';
import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

const faqs = [
    {
        question: 'How do I start charging?',
        answer: 'Lorem ipsum dolor sit amet consectetur',
    },
    {
        question: 'Do I need an app?',
        answer: 'Lorem ipsum dolor sit amet consectetur...',
    },
    {
        question: 'How long does charging take?',
        answer: 'Lorem ipsum dolor sit amet consectetur...',
    },
    {
        question: 'What vehicles are compatible?',
        answer: 'Lorem ipsum dolor sit amet consectetur...',
    },
];

export function DriverFAQ() {
    const [openIndex, setOpenIndex] = useState<number>(-1);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding'>
            <div className='container mx-auto flex flex-col'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>FAQ&apos;s</h2>
                </FadeUp>
                <div className='flex flex-col lg:flex-row gap-10 lg:gap-10 items-center justify-between w-full'>
                    {/* Left Column (FAQ Content) */}
                    <div className='flex flex-col w-full lg:w-[701px] shrink-0'>
                        <div className='flex flex-col w-full'>
                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                return (
                                    <FadeUp
                                        key={index}
                                        delay={index * 0.1}
                                        className='w-full'>
                                        <div
                                            className={cn(
                                                'flex flex-col border-b border-dark/20 w-full overflow-hidden transition-all duration-300',
                                                isOpen ? 'pb-6' : 'pb-0'
                                            )}>
                                            <button
                                                onClick={() => toggleFaq(index)}
                                                className='flex items-center justify-between w-full py-6 group text-left'>
                                                <span className='text-[24px] leading-[100%] tracking-[-0.03em] font-medium text-dark pr-4'>
                                                    {faq.question}
                                                </span>
                                                <div className='relative shrink-0 w-6 h-6 rounded-full bg-dark flex items-center justify-center transition-colors hover:bg-dark/80'>
                                                    <PlusIcon
                                                        className={cn(
                                                            'absolute w-3 h-3 transition-all duration-300',
                                                            isOpen
                                                                ? 'opacity-0 rotate-90'
                                                                : 'opacity-100 rotate-0'
                                                        )}
                                                    />
                                                    <CancelIcon
                                                        stroke='#fff'
                                                        className={cn(
                                                            'absolute w-[10px] h-[10px] transition-all duration-300',
                                                            isOpen
                                                                ? 'opacity-100 rotate-0'
                                                                : 'opacity-0 -rotate-90'
                                                        )}
                                                    />
                                                </div>
                                            </button>

                                            <div
                                                className={cn(
                                                    'grid transition-all duration-300 ease-in-out',
                                                    isOpen
                                                        ? 'grid-rows-[1fr] opacity-100'
                                                        : 'grid-rows-[0fr] opacity-0'
                                                )}>
                                                <div className='overflow-hidden'>
                                                    <p className='text-[20px] leading-[120%] font-normal text-dark pt-2'>
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </FadeUp>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column (Image) */}
                    <FadeUp
                        delay={0.2}
                        className='lg:flex-1 h-[288px] lg:h-[288px] w-[620px] shrink-0 relative'>
                        <div className='w-full h-full relative rounded-[16px] overflow-hidden'>
                            <Image
                                src='/assets/images/faq-image.png'
                                alt='Driver charging EV'
                                fill
                                className='object-cover'
                            />
                        </div>
                    </FadeUp>
                </div>
            </div>
        </section>
    );
}

