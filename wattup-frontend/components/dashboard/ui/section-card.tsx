import type { ReactNode } from 'react';

/**
 * A titled panel.
 *
 * The title and description live in the same relationship as on the page header, one
 * level down, so a screen reads as a hierarchy rather than as a stack of boxes.
 */
export function SectionCard({
    title,
    description,
    actions,
    footer,
    padded = true,
    className = '',
    children,
}: {
    title?: string;
    description?: string;
    actions?: ReactNode;
    footer?: ReactNode;
    /** Off when the child draws to the card's edge, such as a table. */
    padded?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={`dash-card overflow-hidden ${className}`}>
            {(title || actions) && (
                <header className='flex items-start justify-between gap-4 px-5 pt-5 pb-4'>
                    <div className='min-w-0'>
                        {title && (
                            <h2 className='text-[15px] font-semibold tracking-[-0.01em] text-dash-heading'>
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className='mt-1 text-[13px] leading-relaxed text-dash-muted'>
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
                    )}
                </header>
            )}
            <div className={padded ? 'px-5 pb-5' : ''}>{children}</div>
            {footer && (
                <footer className='border-t border-dash-border bg-dash-canvas/60 px-5 py-3.5'>
                    {footer}
                </footer>
            )}
        </section>
    );
}
