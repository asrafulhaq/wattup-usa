'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            /*  variant='ghost' */
            /*  size='icon' */
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className='h-8 mb-1 w-8 flex items-center justify-start cursor-pointer bg-transparent border-0 text-text-muted hover:text-foreground hover:bg-transparent transition-colors'>
            <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-text-muted-foreground' />
            <span className='sr-only'>Toggle theme</span>
        </button>
    );
}

