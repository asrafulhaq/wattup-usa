'use client';

import { usePathname } from 'next/navigation';

/**
 * The transition between dashboard screens.
 *
 * Keyed on the pathname so React remounts the subtree on navigation and the CSS
 * animation replays. See .wattup-page-enter in globals.css for why this is a keyframe
 * rather than framer-motion: the previous version could leave the whole page body at
 * opacity 0, and a blank dashboard is a worse failure than an unanimated one.
 */
export function DashboardFadeIn({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div key={pathname} className='wattup-page-enter w-full'>
            {children}
        </div>
    );
}
