import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str);

export const dynamicBlurDataUrl = (w: number = 700, h: number = 475) =>
    `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;

export function getReadTime(content: string): string {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');

    // Decode HTML entities
    const decoded = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"');

    // Count words (handles Bengali, English, and mixed content)
    const words = decoded
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);

    const wordCount = words.length;

    // Average reading speed:
    // English: ~200-250 wpm, Bengali: ~150-180 wpm
    // Using 180 wpm as a middle ground for mixed content
    const wordsPerMinute = 180;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return `${minutes} min read`;
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

