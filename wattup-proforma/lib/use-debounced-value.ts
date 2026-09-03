'use client';

import { useEffect, useState } from 'react';

/**
 * The previous value until `delay` has passed with no further change.
 *
 * Used for the document preview only. The KPI strip reads the model directly and
 * stays instant, because building the model is arithmetic; rendering the document
 * is half a megabyte of string and then a DOM parse, and doing that on every
 * keystroke is what made the paper flicker.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [settled, setSettled] = useState(value);

    useEffect(() => {
        if (Object.is(settled, value)) return;
        const t = setTimeout(() => setSettled(value), delay);
        return () => clearTimeout(t);
    }, [value, delay, settled]);

    return settled;
}
