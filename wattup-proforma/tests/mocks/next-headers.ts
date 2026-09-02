import { vi } from 'vitest';

/**
 * next/headers, for handlers that read the request through headers() rather
 * than from their Request argument (verify-code, the tool route). A test sets
 * what the "current request" carries with setRequestHeaders(); cookies() is
 * an inert store, present only so a module that touches it can load.
 */

let current = new Headers();

export function setRequestHeaders(init: HeadersInit): void {
    current = new Headers(init);
}

export const headers = vi.fn(async (): Promise<Headers> => current);

export const cookies = vi.fn(async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    set: () => undefined,
    delete: () => undefined,
}));

export function resetHeaders(): void {
    current = new Headers();
    headers.mockClear();
    cookies.mockClear();
}
