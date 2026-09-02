import { vi } from 'vitest';

/**
 * next/server's after(), as a recorder. Next runs the callback once the
 * response has been sent; here nothing runs until a test calls
 * runAfterCallbacks(), which is what lets a test assert what happened BEFORE
 * the response (nothing address-dependent) separately from what happened
 * after it (the decision and the send). Callbacks scheduled while the queue is
 * being drained run too, the way lib/auth.ts nests its send inside
 * request-code's after().
 */

type AfterTask = (() => unknown) | Promise<unknown>;

const queue: AfterTask[] = [];

export const after = vi.fn<(task: AfterTask) => void>((task) => {
    queue.push(task);
});

/** How many callbacks after() has been handed since the last reset, run or not. */
export function scheduledAfterCount(): number {
    return after.mock.calls.length;
}

/** Run everything scheduled, in order, including anything scheduled while running. */
export async function runAfterCallbacks(): Promise<void> {
    while (queue.length > 0) {
        const task = queue.shift();
        if (task === undefined) break;
        await (typeof task === 'function' ? task() : task);
    }
}

export function resetAfter(): void {
    queue.length = 0;
    after.mockClear();
}
