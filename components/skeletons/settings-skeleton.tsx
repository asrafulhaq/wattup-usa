import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
    return (
        <div className='space-y-6'>
            {/* Header row */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='space-y-2'>
                    <Skeleton className='h-6 w-35' />
                    <Skeleton className='h-4 w-75' />
                </div>
                <Skeleton className='h-9 w-40' />
            </div>

            {/* Tab list */}
            <div className='flex gap-1'>
                {[100, 130, 140, 120].map((w, i) => (
                    <Skeleton key={i} className={`h-9 w-[${w}px] rounded-md`} />
                ))}
            </div>

            {/* Card */}
            <div className='rounded-xl border bg-card shadow-none'>
                <div className='p-6 border-b border-border/50 space-y-1.5'>
                    <Skeleton className='h-5 w-40' />
                    <Skeleton className='h-4 w-80' />
                </div>
                <div className='p-6 space-y-6'>
                    {[1, 2, 3].map(i => (
                        <div key={i} className='space-y-1.5'>
                            <Skeleton className='h-4 w-35' />
                            <Skeleton className='h-10 w-full' />
                            <Skeleton className='h-3 w-60' />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
