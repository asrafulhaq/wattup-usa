import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * What a screen says when it has nothing to show.
 *
 * Always distinguishes "nothing here yet" from "nothing matched", because the two need
 * opposite responses from the reader and an identical blank panel tells them neither.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
            <span className='flex size-11 items-center justify-center rounded-full bg-dash-canvas text-dash-faint'>
                <Icon className='size-5' />
            </span>
            <p className='mt-4 text-[15px] font-semibold text-dash-heading'>{title}</p>
            {description && (
                <p className='mt-1.5 max-w-sm text-[13px] leading-relaxed text-dash-muted'>
                    {description}
                </p>
            )}
            {action && <div className='mt-5'>{action}</div>}
        </div>
    );
}
