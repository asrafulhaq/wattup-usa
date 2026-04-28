import { Skeleton } from '@/components/ui/skeleton';

export function ArticleSkeleton() {
    return (
        <div className='flex flex-row gap-4 justify-between items-center border-b border-border pb-4'>
            <div className='flex-1 flex flex-col gap-8'>
                <div className='flex items-center justify-between'>
                    <Skeleton className='h-[14px] w-16' />
                    <Skeleton className='h-3.5 w-3.5 rounded-full' />
                </div>
                <div className='flex flex-col gap-2'>
                    <Skeleton className='h-6 md:h-[26px] w-[90%]' />
                    <div className='flex flex-col gap-1.5'>
                        <Skeleton className='h-4 md:h-[23px] w-full' />
                        <Skeleton className='h-4 md:h-[23px] w-[70%]' />
                    </div>
                </div>
                <Skeleton className='h-4 w-32' />
            </div>
            <Skeleton className='w-[106px] h-[80px] md:w-[172px] md:h-[129px] rounded-sm shrink-0' />
        </div>
    );
}

export function ArticleListSkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
                <ArticleSkeleton key={i} />
            ))}
        </div>
    );
}

