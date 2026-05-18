import { Skeleton } from '@/components/ui/skeleton';

export function UsersSkeleton() {
    return (
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='space-y-1.5'>
                    <Skeleton className='h-6 w-16' />
                    <Skeleton className='h-4 w-36' />
                </div>
                <Skeleton className='h-9 w-32 rounded-md' />
            </div>

            {/* Table */}
            <div className='rounded-xl border border-border/40 bg-white overflow-hidden shadow-sm'>
                {/* Table header */}
                <div className='grid grid-cols-[1fr_120px_100px_120px_64px] border-b border-border/40 px-6 py-3 gap-4'>
                    {['User', 'Role', 'Status', 'Joined', ''].map((_, i) => (
                        <Skeleton key={i} className={`h-4 ${i === 4 ? 'w-0' : 'w-16'}`} />
                    ))}
                </div>

                {/* Table rows */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className='grid grid-cols-[1fr_120px_100px_120px_64px] items-center border-b border-border/40 last:border-0 px-6 py-3 gap-4'>
                        {/* User cell */}
                        <div className='flex items-center gap-3'>
                            <Skeleton className='w-8 h-8 rounded-full shrink-0' />
                            <div className='space-y-1.5'>
                                <Skeleton className='h-3.5 w-28' />
                                <Skeleton className='h-3 w-40' />
                            </div>
                        </div>
                        {/* Role badge */}
                        <Skeleton className='h-5 w-20 rounded-full' />
                        {/* Status badge */}
                        <Skeleton className='h-5 w-16 rounded-full' />
                        {/* Joined */}
                        <Skeleton className='h-3.5 w-20' />
                        {/* Actions */}
                        <Skeleton className='h-8 w-8 rounded-lg ml-auto' />
                    </div>
                ))}
            </div>
        </div>
    );
}
