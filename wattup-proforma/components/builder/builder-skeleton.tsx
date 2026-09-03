/**
 * The builder's shape, before it has anything to show.
 *
 * Used in two places on purpose: app/tool/loading.tsx while the page's session
 * check runs on the server, and BuilderApp itself for the one frame between
 * hydration and the client reading its stored state. Sharing the component is what
 * guarantees the two match, so the screen never appears to load twice.
 */
export function BuilderSkeleton() {
    return (
        <div className='flex h-dvh flex-col overflow-hidden'>
            <header className='border-border/60 flex h-14 shrink-0 items-center gap-3 border-b px-4'>
                <div className='bg-muted h-5 w-28 animate-pulse rounded' />
                <div className='bg-border h-7 w-px' />
                <div className='space-y-1.5'>
                    <div className='bg-muted h-3 w-40 animate-pulse rounded' />
                    <div className='bg-muted h-2 w-24 animate-pulse rounded' />
                </div>
                <span className='flex-1' />
                <div className='bg-muted h-8 w-24 animate-pulse rounded-md' />
                <div className='bg-muted h-8 w-16 animate-pulse rounded-md' />
                <div className='bg-muted h-8 w-8 animate-pulse rounded-md' />
                <div className='bg-muted h-8 w-8 animate-pulse rounded-md' />
                <div className='bg-muted h-8 w-32 animate-pulse rounded-md' />
                <div className='bg-muted h-8 w-28 animate-pulse rounded-md' />
            </header>

            <div className='flex min-h-0 flex-1'>
                <aside className='border-border/60 w-[340px] shrink-0 space-y-4 border-r p-4'>
                    <div className='space-y-2 pb-2'>
                        <div className='bg-muted h-2.5 w-full animate-pulse rounded' />
                        <div className='bg-muted h-2.5 w-11/12 animate-pulse rounded' />
                        <div className='bg-muted h-2.5 w-4/5 animate-pulse rounded' />
                    </div>
                    {Array.from({ length: 7 }, (_, i) => (
                        <div key={i} className='flex items-center gap-2.5 py-2'>
                            <div className='bg-muted size-5 shrink-0 animate-pulse rounded' />
                            <div className='bg-muted h-3 w-40 animate-pulse rounded' />
                        </div>
                    ))}
                </aside>

                <main className='flex min-w-0 flex-1 flex-col'>
                    <div className='border-border/60 grid shrink-0 grid-cols-2 border-b md:grid-cols-3 lg:grid-cols-5'>
                        {Array.from({ length: 5 }, (_, i) => (
                            <div
                                key={i}
                                className='border-border/60 space-y-2 border-r px-5 py-3.5 last:border-r-0'
                            >
                                <div className='bg-muted h-6 w-28 animate-pulse rounded' />
                                <div className='bg-muted h-2.5 w-20 animate-pulse rounded' />
                            </div>
                        ))}
                    </div>
                    <div className='bg-muted/40 min-h-0 flex-1 p-6'>
                        <div className='bg-background mx-auto h-full w-[510px] animate-pulse rounded shadow-2xl' />
                    </div>
                    <div className='border-border/60 flex shrink-0 items-center gap-3 border-t px-5 py-2.5'>
                        <div className='bg-muted h-2.5 w-10 animate-pulse rounded' />
                        <div className='bg-muted h-1.5 w-40 animate-pulse rounded-full' />
                        <div className='bg-muted h-2.5 w-8 animate-pulse rounded' />
                        <span className='flex-1' />
                        <div className='bg-muted h-2.5 w-48 animate-pulse rounded' />
                    </div>
                </main>
            </div>
        </div>
    );
}
