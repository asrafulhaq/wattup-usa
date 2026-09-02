'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

/** The search field every list screen uses, so they all sit at the same height. */
export function ToolbarSearch({
    value,
    onChange,
    placeholder = 'Search...',
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`}>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dash-faint' />
            <Input
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                className='h-10 rounded-[10px] border-dash-border bg-dash-surface pl-9 text-sm placeholder:text-dash-faint'
            />
        </div>
    );
}

/** Search on the left, filters and the primary action on the right. */
export function Toolbar({
    search,
    children,
}: {
    search?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            {search ? <div className='w-full lg:max-w-md'>{search}</div> : <div />}
            <div className='flex flex-wrap items-center gap-2'>{children}</div>
        </div>
    );
}

/**
 * A small set of mutually exclusive choices.
 *
 * A segmented control rather than a select: with three or four options the choices are
 * worth showing, and the current one is then readable without opening anything.
 */
export function SegmentedFilter({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
}) {
    return (
        <div
            role='group'
            aria-label={label}
            className='flex items-center gap-0.5 rounded-[10px] border border-dash-border bg-dash-surface p-1'>
            {options.map(option => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type='button'
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={`rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                            active
                                ? 'bg-primary text-white'
                                : 'text-dash-muted hover:bg-dash-canvas hover:text-dash-body'
                        }`}>
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
