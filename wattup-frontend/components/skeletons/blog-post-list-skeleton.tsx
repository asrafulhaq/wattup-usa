import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function PressReleaseCardSkeleton({
    isMobileSlider = false,
}: {
    isMobileSlider?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex gap-6 w-full items-start',
                isMobileSlider ? 'flex-col' : 'flex-col md:flex-row md:gap-8'
            )}>
            {/* Image Skeleton */}
            <Skeleton
                className={cn(
                    'relative w-full shrink-0 rounded-[8px]',
                    isMobileSlider ? 'h-[400px]' : 'h-[240px] md:w-[440px]'
                )}
            />

            <div className='content flex flex-col gap-3 md:gap-5 flex-1 w-full'>
                {/* Date & Read Time */}
                <Skeleton className='h-5 w-32' />

                {/* Title & Description */}
                <div className='flex flex-col gap-3 w-full'>
                    <Skeleton className='h-8 w-3/4' />
                    <div className='space-y-2'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-2/3' />
                    </div>
                </div>

                <Skeleton className='h-6 w-24 mt-2' />
            </div>
        </div>
    );
}

export function BlogPostListSkeleton() {
    return (
        <section className='w-full max-w-[1444px] mx-auto common-section-padding max-md:pt-0! overflow-hidden'>
            <div className='container mx-auto flex flex-col'>
                {/* Header Skeleton */}
                <Skeleton className='h-12 w-[348px] md:w-[400px] mb-6' />
                <div className='mb-5 md:mb-[56px] space-y-2'>
                    <Skeleton className='h-6 w-[300px] md:w-[450px]' />
                    <Skeleton className='h-6 w-[200px] md:w-[300px]' />
                </div>

                {/* Desktop List Skeleton View */}
                <div className='hidden md:flex flex-col gap-12'>
                    {[...Array(3)].map((_, i) => (
                        <PressReleaseCardSkeleton key={i} />
                    ))}
                </div>

                {/* Mobile Skeleton View */}
                <div className='block md:hidden'>
                    <PressReleaseCardSkeleton isMobileSlider={true} />
                    {/* Dots Skeleton */}
                    <div className='flex justify-center gap-2 mt-8'>
                        <Skeleton className='h-2 w-2 rounded-full' />
                        <Skeleton className='h-2 w-2 rounded-full opacity-50' />
                        <Skeleton className='h-2 w-2 rounded-full opacity-50' />
                    </div>
                </div>
            </div>
        </section>
    );
}
