import { Skeleton } from '@/components/ui/skeleton';

export function DisclaimerSkeleton() {
    return (
        <div className='flex flex-col gap-10 w-full'>
            {/* Header Skeleton */}
            <div className='flex flex-col gap-4'>
                <Skeleton className='h-[44px] md:h-[64px] w-[60%] md:w-[40%]' />
                <Skeleton className='h-[18px] w-32' />
            </div>

            {/* Content Skeleton */}
            <div className='flex flex-col gap-10'>
                <div className='flex flex-col gap-6'>
                    <div className='space-y-4'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-[95%]' />
                        <Skeleton className='h-4 w-[98%]' />
                        <Skeleton className='h-4 w-[92%]' />
                        <Skeleton className='h-4 w-[85%]' />
                    </div>

                    <div className='space-y-4 mt-6'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-[96%]' />
                        <Skeleton className='h-4 w-[93%]' />
                        <Skeleton className='h-4 w-[88%]' />
                    </div>

                    <div className='space-y-4 mt-6'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-[90%]' />
                        <Skeleton className='h-4 w-[94%]' />
                        <Skeleton className='h-4 w-[80%]' />
                    </div>
                </div>
            </div>
        </div>
    );
}
