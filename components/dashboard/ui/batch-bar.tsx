'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * A button inside the selection bar.
 *
 * Sized and coloured for that bar, and used by every list, which is what stops Articles
 * and Locations growing two different selection bars.
 */
export function BatchButton({
    icon: Icon,
    onClick,
    disabled,
    tone = 'default',
    children,
}: {
    icon?: LucideIcon | (() => ReactNode);
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'destructive';
    children: ReactNode;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className={`flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors disabled:opacity-50 ${
                tone === 'destructive'
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-dash-body hover:bg-dash-canvas hover:text-dash-heading'
            }`}>
            {Icon && <Icon className='size-4' />}
            {children}
        </button>
    );
}
