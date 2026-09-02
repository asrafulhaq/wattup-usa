import { Skeleton } from '@/components/ui/skeleton';

export function PressReleaseDetailsSkeleton() {
    return (
        <div className='flex w-full flex-col animate-pulse'>
            {/* Header Skeleton */}
            <section className='w-full bg-[#EEEEEE] pt-[75px] pb-[40px]'>
                <div className='container mx-auto common-section-padding flex flex-col'>
                    <div className='flex flex-col gap-[16px] max-w-[744px]'>
                        <div className='flex items-center gap-2 mb-2'>
                             <Skeleton className='h-4 w-4 rounded-full' />
                             <Skeleton className='h-4 w-32' />
                        </div>
                        <Skeleton className='h-10 md:h-12 w-full max-w-[600px] rounded-lg' />
                        <Skeleton className='h-10 md:h-12 w-3/4 max-w-[400px] rounded-lg' />
                        <Skeleton className='h-6 w-40 mt-2 rounded-md' />
                    </div>
                </div>
            </section>

            {/* Content Skeleton */}
            <article className='w-full common-section-padding bg-background'>
                <div className='container max-md:px-4 items-center w-full max-w-[700px] mx-auto flex flex-col'>
                    {/* Hero Image Skeleton */}
                    <Skeleton className='w-full max-w-[700px] h-[293px] sm:h-[400px] rounded-[12px] mb-[40px]' />

                    {/* Text Blocks Skeleton */}
                    <div className='w-full flex flex-col gap-4'>
                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-11/12 rounded-md' />
                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-10/12 rounded-md' />
                        
                        <div className='my-8 w-full'>
                             <Skeleton className='h-8 w-3/4 mb-4 rounded-lg' />
                             <Skeleton className='h-5 w-full rounded-md' />
                             <Skeleton className='h-5 w-full rounded-md' />
                             <Skeleton className='h-5 w-9/12 rounded-md' />
                        </div>

                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-11/12 rounded-md' />
                    </div>
                </div>
            </article>
        </div>
    );
}

export default PressReleaseDetailsSkeleton;
