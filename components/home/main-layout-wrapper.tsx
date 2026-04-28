'use client';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isArticlePage = pathname.includes('/posts');

    return (
        <div
            className={cn(
                'min-h-fit bg-background flex flex-col items-center',
                {
                    'md:h-screen md:overflow-hidden': !isArticlePage,
                    'h-auto': isArticlePage,
                }
            )}>
            {children}
        </div>
    );
}

