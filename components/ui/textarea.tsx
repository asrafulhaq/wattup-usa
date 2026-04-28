import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                'file:text-foreground placeholder:text-dark/50 selection:bg-primary selection:text-primary-foreground bg-gray/30 border-transparent flex min-h-[114px] w-full rounded-[8px] border px-5 py-4 text-[16px] leading-[130%] tracking-[-3%] font-medium transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-dark',
                'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
