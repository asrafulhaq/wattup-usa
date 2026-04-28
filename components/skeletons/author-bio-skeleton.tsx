import { Skeleton } from '@/components/ui/skeleton';

export function AuthorBioSkeleton() {
    return (
        <>
            {/* Desktop Skeleton */}
            <div className='hidden md:flex flex-col gap-2'>
                <Skeleton className='w-12 h-12 rounded-full shrink-0' />
                <div className='flex flex-col gap-2'>
                    <Skeleton className='h-[22px] w-24' />
                    <div className='space-y-1.5'>
                        <Skeleton className='h-[18px] w-full' />
                        <Skeleton className='h-[18px] w-[90%]' />
                    </div>
                    <Skeleton className='h-[18px] w-20 mt-[32px]' />
                </div>
            </div>

            {/* Mobile Skeleton */}
            <div className='md:hidden flex flex-col gap-2 py-8'>
                <div className='flex flex-col gap-2'>
                    <Skeleton className='w-12 h-12 rounded-full shrink-0' />
                    <div className='flex items-center gap-2'>
                        <Skeleton className='h-[22px] w-24' />
                        <Skeleton className='h-[18px] w-16' />
                    </div>
                </div>
                <div className='space-y-1.5'>
                    <Skeleton className='h-[18px] w-full' />
                    <Skeleton className='h-[18px] w-[85%]' />
                </div>
            </div>
        </>
    );
}
