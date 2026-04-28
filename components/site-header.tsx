import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export async function SiteHeader() {
    return (
        <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
            <div className='flex w-full items-center gap-1 px-4 md:gap-2 md:px-6'>
                <SidebarTrigger className='-ml-1' />
                <Separator
                    orientation='vertical'
                    className='mx-2 data-[orientation=vertical]:h-4'
                />
                <h1 className='text-base font-medium'>Welcome !</h1>
            </div>
        </header>
    );
}

