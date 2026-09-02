'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    align?: 'start' | 'center' | 'end';
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    className,
    align = 'start',
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant='outline'
                    className={cn(
                        'h-8 w-fit px-3 justify-start text-left text-xs font-normal bg-muted/30  text-foreground border-border border',
                        !value && 'text-muted-foreground',
                        className
                    )}>
                    {!value && <CalendarIcon className='mr-1 h-3.5 w-3.5 shrink-0' />}
                    <span className='truncate'>
                        {value ? format(value, 'PPP') : placeholder}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align={align}>
                <Calendar
                    mode='single'
                    selected={value}
                    onSelect={onChange}
                />
            </PopoverContent>
        </Popover>
    );
}
