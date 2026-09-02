import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the tabbed location form, so the swap to real content does not jump. */
export function LocationFormSkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-end gap-3'>
                <Skeleton className='h-9 w-20' />
                <Skeleton className='h-9 w-36' />
            </div>

            <div className='flex gap-2'>
                {[72, 84, 88, 96, 80].map((width, i) => (
                    <Skeleton key={i} className='h-9' style={{ width }} />
                ))}
            </div>

            <div className='rounded-lg border border-border p-5'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='mt-2 h-4 w-2/3' />
                <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className='flex flex-col gap-2'>
                            <Skeleton className='h-4 w-28' />
                            <Skeleton className='h-9 w-full' />
                            <Skeleton className='h-3 w-40' />
                        </div>
                    ))}
                </div>
                <Skeleton className='mt-4 h-20 w-full' />
            </div>
        </div>
    );
}
