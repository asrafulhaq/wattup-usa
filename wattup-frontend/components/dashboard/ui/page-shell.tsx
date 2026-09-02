import type { ReactNode } from 'react';

/**
 * The padding and measure every dashboard screen shares.
 *
 * Capped rather than full bleed: a table stretched across a 27 inch monitor puts the
 * row's first and last cell so far apart that scanning one row becomes a head movement.
 */
export function PageShell({ children }: { children: ReactNode }) {
    return (
        <div className='mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8'>
            {children}
        </div>
    );
}
