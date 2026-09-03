import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * DIVERGES from wattup-frontend's copy, deliberately.
 *
 * That one is built for the marketing forms: 56px tall, 16px type, and colours
 * pinned with `text-dark` and `placeholder:text-dark/50`. `--dark` is NOT
 * redefined in this app's `.dark` block, so those two classes render dark text on
 * a dark background and the field becomes unreadable the moment the panel is in
 * dark mode. The builder is a dense, themeable control panel, so it uses the
 * theme tokens (`foreground`, `muted-foreground`, `input`, `border`) and a compact
 * default height instead.
 *
 * Keep the token block in app/globals.css in sync with the frontend by hand, as
 * ADR 0001 section 3 requires. This component is not part of that sync.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot='input'
            className={cn(
                'border-input bg-background text-foreground placeholder:text-muted-foreground/70 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'selection:bg-primary selection:text-primary-foreground',
                'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                className
            )}
            {...props}
        />
    );
}

export { Input };
