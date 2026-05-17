import { FadeUp } from '@/components/ui/fade-up';
import Link from 'next/link';
import { ArrowLeftIcon } from '../icons/icons';

export function PressReleaseDetailsHeader({
    title,
    date,
}: {
    title: string;
    date: string;
}) {
    return (
        <section className='w-full bg-[#EEEEEE] pt-[75px]  pb-[40px]'>
            <div className='container mx-auto common-section-padding flex flex-col'>
                <FadeUp>
                    <div className='flex flex-col gap-[16px] max-w-[744px]'>
                        <Link
                            href='/press-release'
                            className='flex items-center gap-[10px] text-dark font-semibold text-[16px] hover:text-dark/80 transition-colors'>
                            <ArrowLeftIcon className='h-4' />
                            Back to archive
                        </Link>

                        <h1 className='headline text-dark'>{title}</h1>

                        <p className='text-[20px] font-semibold max-w-[670px] leading-[130%] traking-[-03%] text-dark/70'>
                            {date || 'March 25, 2026'}{' '}
                            <Link className='font-light ml-1' href='/'>
                                | <span className='ml-1'>WattUpUSA</span>
                            </Link>
                        </p>
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

export default PressReleaseDetailsHeader;




