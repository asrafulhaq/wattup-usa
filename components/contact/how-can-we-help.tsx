import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const HowCanWeHelp = () => {
    return (
        <section className='w-full pb-0 pt-10 md:py-[82px] bg-white'>
            <div className='container mx-auto '>
                <div className='max-w-[555px] mx-auto flex flex-col items-center text-center'>
                    <FadeUp>
                        <h2 className='headline text-dark mb-4'>
                            How Can We Help?
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.1}>
                        <p className='text-[16px] md:text-[20px] font-normal leading-[130%] text-dark max-md:max-w-[343px] mx-auto mb-6'>
                            Before reaching out, you may find answers to common
                            questions in our FAQ section.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.2} className='w-full md:w-auto'>
                        <Link
                            href='/faq'
                            className={cn(
                                'inline-flex w-full items-center justify-center px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] leading-[130%] transition-colors duration-500 shadow-btn whitespace-nowrap min-w-[132px]'
                            )}>
                            View FAQ
                        </Link>
                    </FadeUp>
                </div>
            </div>
        </section>
    );
};

