import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * The dashboard's unit suite, shaped like wattup-proforma/vitest.config.mts.
 *
 * Node environment: the subjects are route handlers and plain functions, and
 * Request, Response, Headers and node:crypto are Node's own. The `@` alias
 * matches tsconfig.json, so a vi.mock of '@/lib/prisma' intercepts the same
 * specifier the application imports. No test may reach the database: every
 * suite replaces '@/lib/prisma' before importing its subject.
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
    },
});
