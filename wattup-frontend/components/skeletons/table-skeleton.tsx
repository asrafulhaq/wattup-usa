import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
    return (
        <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
                <Skeleton className='h-8 w-[200px]' />
                <Skeleton className='h-8 w-[120px]' />
            </div>
            <div className='rounded-md border'>
                <div className='h-12 border-b px-4 flex items-center gap-4'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-[150px]' />
                    <Skeleton className='h-4 w-[100px]' />
                    <Skeleton className='h-4 w-[200px]' />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className='h-16 border-b px-4 flex items-center gap-4'>
                        <Skeleton className='h-4 w-4' />
                        <Skeleton className='h-4 w-[150px]' />
                        <Skeleton className='h-4 w-[100px]' />
                        <Skeleton className='h-4 w-[200px]' />
                    </div>
                ))}
            </div>
            <div className='flex items-center justify-between'>
                <Skeleton className='h-8 w-[100px]' />
                <div className='flex items-center gap-2'>
                    <Skeleton className='h-8 w-8' />
                    <Skeleton className='h-8 w-8' />
                </div>
            </div>
        </div>
    );
}
