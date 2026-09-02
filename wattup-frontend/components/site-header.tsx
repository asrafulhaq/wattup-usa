import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

/**
 * The dashboard's top bar.
 *
 * Deliberately thin. The reference this was modelled on carries a global search and a
 * notification bell; neither exists behind this dashboard yet, and a control that looks
 * live and does nothing costs more trust than the space it fills saves. What is here is
 * real: where you are, and a way out to the public site.
 */
export function SiteHeader({ name }: { name?: string | null }) {
    const firstName = name?.trim().split(/\s+/)[0];

    return (
        <header className='sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-dash-border bg-dash-surface/85 backdrop-blur-sm'>
            <div className='flex w-full items-center gap-1 px-4 md:gap-2 md:px-6'>
                <SidebarTrigger className='-ml-1 text-dash-muted' />
                <Separator
                    orientation='vertical'
                    className='mx-2 data-[orientation=vertical]:h-4'
                />
                <p className='truncate text-sm text-dash-body'>
                    {firstName ? (
                        <>
                            Welcome back,{' '}
                            <span className='font-medium text-dash-heading'>{firstName}</span>
                        </>
                    ) : (
                        'WattUp dashboard'
                    )}
                </p>

                <Link
                    href='/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='ml-auto flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[13px] font-medium text-dash-muted transition-colors hover:bg-dash-canvas hover:text-dash-heading'>
                    View site
                    <ArrowUpRight className='size-3.5' />
                </Link>
            </div>
        </header>
    );
}
