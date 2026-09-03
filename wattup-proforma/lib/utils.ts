import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes so a later class wins over an earlier conflicting one.
 * Copied from wattup-frontend by hand, like the design tokens: ADR 0001 section 3
 * forbids importing across the two apps.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
