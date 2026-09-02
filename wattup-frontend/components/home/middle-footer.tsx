'use client';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Footer from './footer';

const MiddleFooter = () => {
    const pathname = usePathname();
    const articlePage = pathname.includes('/posts');
    return (
        <>
            {articlePage && (
                <hr className='border-border w-screen block md:hidden' />
            )}
            <div
                className={cn('flex justify-center items-center py-4', {
                    'md:hidden': !articlePage,
                })}>
                <Footer />
            </div>
        </>
    );
};

export default MiddleFooter;

