import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * The gate's unit suite. tests/README.md says what is mocked and why.
 *
 * Node environment: every subject is a route handler or a plain function, and
 * Request, Response, Headers and crypto.randomUUID are Node's own. The `@`
 * alias matches tsconfig.json, so the mocks registered in tests/setup.ts
 * intercept the same specifiers the application imports.
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('.', import.meta.url)),
        },
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
    },
});
