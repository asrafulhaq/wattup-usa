import type { ReactNode } from 'react';

/**
 * The top of every dashboard screen.
 *
 * A title, one line saying what the screen is for, and the actions. Uniform across
 * pages so moving between them does not feel like moving between products.
 */
export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
                <h1 className='text-[26px] leading-tight font-bold tracking-[-0.02em] text-dash-heading'>
                    {title}
                </h1>
                {description && (
                    <p className='mt-1.5 text-sm text-dash-muted'>{description}</p>
                )}
            </div>
            {actions && (
                <div className='flex shrink-0 flex-wrap items-center gap-2'>{actions}</div>
            )}
        </div>
    );
}
