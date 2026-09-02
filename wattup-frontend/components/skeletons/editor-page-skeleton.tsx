import { Skeleton } from '@/components/ui/skeleton';

export function EditorPageSkeleton() {
    return (
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
            <div className='flex items-center justify-between'>
                <Skeleton className='h-8 w-[200px]' />
                <Skeleton className='h-10 w-[120px]' />
            </div>
            <div className='flex flex-1 flex-col rounded-xl border bg-card text-card-foreground shadow'>
                <div className='flex flex-col space-y-1.5 p-6'>
                    <Skeleton className='h-6 w-[100px]' />
                </div>
                <div className='flex-1 p-6 pt-0 pb-4'>
                    <Skeleton className='h-[400px] w-full rounded-xl' />
                </div>
            </div>
        </div>
    );
}
