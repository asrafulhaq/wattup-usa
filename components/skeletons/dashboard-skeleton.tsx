import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
    return (
        <div className='min-h-screen bg-gray-light p-4 sm:p-6 lg:p-8'>
            <div className='max-w-7xl mx-auto w-full'>
                {/* Welcome */}
                <div className='mb-8 space-y-2'>
                    <Skeleton className='h-8 w-64' />
                    <Skeleton className='h-4 w-48' />
                </div>

                {/* Cards grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {/* Profile card */}
                    <div className='sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-border/40 p-6 flex flex-col gap-6'>
                        <div className='flex items-center gap-4'>
                            <Skeleton className='w-16 h-16 rounded-2xl shrink-0' />
                            <div className='space-y-2 flex-1'>
                                <Skeleton className='h-4 w-32' />
                                <Skeleton className='h-3 w-48' />
                            </div>
                        </div>
                        <div className='flex flex-col gap-3'>
                            {[1, 2, 3].map(i => (
                                <div key={i} className='flex items-center justify-between'>
                                    <Skeleton className='h-3 w-20' />
                                    <Skeleton className='h-5 w-16 rounded-full' />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User ID card */}
                    <div className='bg-white rounded-2xl border border-border/40 p-6'>
                        <Skeleton className='h-3 w-16 mb-3' />
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-3/4 mt-1' />
                    </div>

                    {/* Session card */}
                    <div className='bg-white rounded-2xl border border-border/40 p-6 flex flex-col justify-between'>
                        <Skeleton className='h-3 w-24 mb-3' />
                        <div className='flex items-center gap-2 mt-auto'>
                            <Skeleton className='w-2.5 h-2.5 rounded-full' />
                            <Skeleton className='h-4 w-14' />
                        </div>
                        <Skeleton className='h-3 w-40 mt-3' />
                    </div>
                </div>
            </div>
        </div>
    );
}
