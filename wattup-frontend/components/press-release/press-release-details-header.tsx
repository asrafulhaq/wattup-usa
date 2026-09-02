import { FadeUp } from '@/components/ui/fade-up';
import Link from 'next/link';
import { ArrowLeftIcon } from '../icons/icons';

export function PressReleaseDetailsHeader({
    title,
    date,
    author,
    authorUrl,
}: {
    title: string;
    date: string;
    author?: string;
    authorUrl?: string;
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
                            {author && (
                                <span className='font-light ml-1'>
                                    |{' '}
                                    {authorUrl ? (
                                        <Link
                                            href={authorUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='ml-1 '>
                                            {author}
                                        </Link>
                                    ) : (
                                        <span className='ml-1'>{author}</span>
                                    )}
                                </span>
                            )}
                        </p>
                    </div>
                </FadeUp>
            </div>
        </section>
    );
}

export default PressReleaseDetailsHeader;




