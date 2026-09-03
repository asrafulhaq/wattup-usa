import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * DIVERGES from wattup-frontend's copy, for the reason recorded in input.tsx:
 * its `text-dark` and `placeholder:text-dark/50` are invisible in this app's dark
 * theme, because `--dark` is not redefined there.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                data-slot='textarea'
                className={cn(
                    'border-input bg-background text-foreground placeholder:text-muted-foreground/70 flex min-h-16 w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                    'selection:bg-primary selection:text-primary-foreground',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]',
                    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
