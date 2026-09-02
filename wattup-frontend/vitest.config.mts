import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Unit suite for the dashboard app. No database, no network: every module that
 * would reach one is replaced with vi.mock inside the test that needs it.
 *
 * Node environment: the subjects are server actions and plain functions. The
 * `@` alias matches tsconfig.json, so a mock registered against '@/lib/auth'
 * intercepts the same specifier the application imports. `.next` and
 * `node_modules` are excluded by name so nothing a build emits can be picked up
 * as a test.
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
        exclude: ['**/node_modules/**', '**/.next/**'],
    },
});
