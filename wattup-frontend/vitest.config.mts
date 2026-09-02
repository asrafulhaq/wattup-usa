import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * Unit tests for the parts of this app that decide who may do what. Run with
 * `pnpm test`. Tests live in `__tests__` folders beside the code they cover.
 *
 * Nothing here touches a database: the resolver is tested against a stub client and
 * the modules that import the Prisma singleton mock it.
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': root,
            // `import 'server-only'` throws outside a React Server Components build,
            // which is exactly the guard it exists to be. The stub makes it a no-op
            // under Vitest so server modules can be imported by a test.
            'server-only': path.resolve(root, 'test/stubs/server-only.ts'),
        },
    },
    test: {
        environment: 'node',
        include: ['**/__tests__/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.next/**'],
    },
});
