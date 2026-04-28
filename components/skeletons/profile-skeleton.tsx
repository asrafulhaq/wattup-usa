import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
    return (
        <div className='grid gap-6'>
            <div className='grid gap-6 md:grid-cols-2'>
                {/* Personal Info Card Skeleton */}
                <div className='rounded-xl border bg-card text-card-foreground shadow-none'>
                    <div className='p-6 flex flex-row items-center justify-between border-b border-border/50'>
                        <Skeleton className='h-6 w-[180px]' />
                        <Skeleton className='h-8 w-[80px]' />
                    </div>
                    <div className='p-6 space-y-6'>
                        <div className='flex items-center gap-4'>
                            <Skeleton className='h-20 w-20 rounded-full' />
                            <Skeleton className='h-9 w-[120px]' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[50px]' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[80px]' />
                            <Skeleton className='h-24 w-full' />
                        </div>
                    </div>
                </div>

                {/* Social Links Card Skeleton */}
                <div className='rounded-xl border bg-card text-card-foreground shadow-none'>
                    <div className='p-6 flex flex-row items-center justify-between border-b border-border/50'>
                        <Skeleton className='h-6 w-[150px]' />
                        <Skeleton className='h-8 w-[60px]' />
                    </div>
                    <div className='p-6 space-y-4'>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[100px]' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[120px]' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[90px]' />
                            <Skeleton className='h-10 w-full' />
                        </div>
                    </div>
                </div>

                {/* About Section Card Skeleton */}
                <div className='rounded-xl border bg-card text-card-foreground shadow-none md:col-span-2'>
                    <div className='p-6 flex flex-row items-center justify-between border-b border-border/50'>
                        <Skeleton className='h-6 w-[150px]' />
                        <Skeleton className='h-8 w-[60px]' />
                    </div>
                    <div className='p-6 space-y-4'>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-[100px]' />
                            <Skeleton className='h-[300px] w-full rounded-md' />
                        </div>
                    </div>
                </div>

                {/* Credentials Update Skeletons */}
                <div className='md:col-span-2 grid gap-6 lg:grid-cols-2 grid-cols-1'>
                    {[1, 2].map((i) => (
                        <div key={i} className='rounded-xl border bg-card text-card-foreground shadow-none'>
                            <div className='p-6 flex flex-col space-y-1.5'>
                                <Skeleton className='h-6 w-[180px]' />
                            </div>
                            <div className='p-6 pt-0 space-y-4 mt-2'>
                                <div className='space-y-2'>
                                    <Skeleton className='h-4 w-[100px]' />
                                    <Skeleton className='h-10 w-full' />
                                </div>
                                <Skeleton className='h-9 w-full' />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
