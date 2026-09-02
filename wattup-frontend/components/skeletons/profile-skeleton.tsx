import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors components/dashboard/profile/page-content.tsx.
 *
 * Two cards side by side, Personal Information and Social Links, then the credentials
 * pair below. The previous version drew an "About" card the page has not rendered for
 * some time, so the layout visibly rearranged itself the moment the real content
 * arrived.
 *
 * Social Links only renders for a role that may manage them, so the second card is
 * optional here too.
 */
export function ProfileSkeleton({
    withSocialLinks = true,
}: {
    withSocialLinks?: boolean;
}) {
    return (
        <div className='flex w-full flex-col gap-6'>
            <div
                className={`grid w-full grid-cols-1 gap-6${
                    withSocialLinks ? ' md:grid-cols-2' : ''
                }`}>
                {/* Personal Information */}
                <div className='dash-card'>
                    <div className='flex flex-row flex-wrap items-center justify-between gap-4 p-6'>
                        <Skeleton className='h-[22px] w-44' />
                        <Skeleton className='h-9 w-36 rounded-md' />
                    </div>
                    <div className='space-y-6 px-6 pb-6'>
                        <div className='flex flex-wrap items-center gap-4'>
                            <Skeleton className='size-20 shrink-0 rounded-full' />
                            <Skeleton className='h-9 w-32 rounded-md' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-[14px] w-12' />
                            <Skeleton className='h-10 w-full rounded-md' />
                        </div>
                        <div className='space-y-2'>
                            <Skeleton className='h-[14px] w-20' />
                            <Skeleton className='h-24 w-full rounded-md' />
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                {withSocialLinks && (
                    <div className='dash-card'>
                        <div className='flex flex-row flex-wrap items-center justify-between gap-4 p-6'>
                            <Skeleton className='h-[22px] w-32' />
                            <Skeleton className='h-9 w-28 rounded-md' />
                        </div>
                        <div className='space-y-4 px-6 pb-6'>
                            {[0, 1, 2].map(i => (
                                <div key={i} className='flex items-center gap-3'>
                                    <Skeleton className='h-10 flex-1 rounded-md' />
                                    <Skeleton className='h-10 flex-[2] rounded-md' />
                                    <Skeleton className='size-9 shrink-0 rounded-md' />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Credentials: change password and change email, side by side. */}
            <div className='grid gap-6 md:grid-cols-2'>
                {[0, 1].map(i => (
                    <div key={i} className='dash-card flex flex-col'>
                        <div className='space-y-2 p-6'>
                            <Skeleton className='h-[22px] w-44' />
                            <Skeleton className='h-[14px] w-64' />
                        </div>
                        <div className='flex-1 space-y-4 px-6 pb-6'>
                            {[0, 1].map(f => (
                                <div key={f} className='space-y-2'>
                                    <Skeleton className='h-[14px] w-32' />
                                    <Skeleton className='h-10 w-full rounded-md' />
                                </div>
                            ))}
                            <Skeleton className='h-9 w-full rounded-md' />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
