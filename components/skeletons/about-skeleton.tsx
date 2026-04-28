import { Skeleton } from '@/components/ui/skeleton';

export function AboutSkeleton() {
    return (
        <div className='flex flex-col gap-6 w-full'>
            <div className='space-y-4'>
                <Skeleton className='h-4 w-[95%]' />
                <Skeleton className='h-4 w-[90%]' />
                <Skeleton className='h-4 w-[92%]' />
                <Skeleton className='h-4 w-[85%]' />
            </div>

            <div className='space-y-4 mt-4'>
                <Skeleton className='h-4 w-[98%]' />
                <Skeleton className='h-4 w-[93%]' />
                <Skeleton className='h-4 w-[96%]' />
                <Skeleton className='h-4 w-[88%]' />
            </div>

            <div className='space-y-4 mt-4'>
                <Skeleton className='h-4 w-[94%]' />
                <Skeleton className='h-4 w-[89%]' />
                <Skeleton className='h-4 w-[91%]' />
                <Skeleton className='h-4 w-[80%]' />
            </div>
        </div>
    );
}

