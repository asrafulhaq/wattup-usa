import { afterEach, beforeEach, vi } from 'vitest';

import { resetAuth } from './mocks/auth';
import { resetDirectory } from './mocks/member-directory';
import { resetEmail } from './mocks/email';
import { resetHeaders } from './mocks/next-headers';
import { resetAfter } from './mocks/next-server';
import { resetPrisma } from './mocks/prisma';

/**
 * Runs before every test file. Two jobs:
 *
 *   1. The environment. Every name lib/env.ts requires is set to a value that
 *      is plainly fake and could not reach anything: the "database" is port 1
 *      on loopback, the Resend key is not a key. Nothing here is read from
 *      .env, and nothing a test does can read it either, because the modules
 *      that would (lib/prisma.ts, lib/email.ts, lib/auth.ts) are replaced
 *      below before any test file is imported.
 *
 *   2. The mocks. vi.mock in a setup file applies to every test file, so no
 *      test can forget one and load the real client. The specifiers are the
 *      ones the application uses (the `@` alias in vitest.config.mts), so the
 *      routes under test receive these stand-ins through their own imports.
 *
 * tests/README.md is the prose version of this file.
 */

const TEST_ENV: Record<string, string> = {
    BETTER_AUTH_SECRET: 'test-secret-not-a-real-secret-0123456789abcdef0123456789abcdef',
    BETTER_AUTH_URL: 'https://hostproposal.test',
    NEXT_PUBLIC_APP_URL: 'https://hostproposal.test',
    DATABASE_URL: 'postgresql://nobody:nothing@127.0.0.1:1/never?sslmode=disable',
    RESEND_API_KEY: 're_test_never_a_real_key',
    MAIL_FROM: 'WattUp <noreply@hostproposal.test>',
};

for (const [name, value] of Object.entries(TEST_ENV)) process.env[name] = value;
for (const name of ['PROFORMA_ALLOWLIST', 'SESSION_TTL_DAYS', 'OTP_TTL_SECONDS', 'MAIL_REPLY_TO', 'VERCEL_URL']) {
    delete process.env[name];
}

// The application's own modules, replaced wholesale.
vi.mock('@/lib/prisma', () => import('./mocks/prisma'));
vi.mock('@/lib/auth', () => import('./mocks/auth'));
vi.mock('@/lib/email', () => import('./mocks/email'));

// lib/member-directory.ts stays real except for the one function that picks
// an implementation: tests script the directory's answer directly.
vi.mock('@/lib/member-directory', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/member-directory')>();
    const { directory } = await import('./mocks/member-directory');
    return { ...actual, getMemberDirectory: () => directory };
});

// Next's request-scoped APIs, which have no request to be scoped to here.
vi.mock('next/headers', () => import('./mocks/next-headers'));
vi.mock('next/server', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next/server')>();
    const { after } = await import('./mocks/next-server');
    return { ...actual, after };
});

// Guards, not stand-ins: if anything reaches these, the suite is wrong.
vi.mock('resend', () => ({
    Resend: class {
        constructor() {
            throw new Error('[tests] a Resend client must never be constructed in a test');
        }
    },
}));
vi.mock('@prisma/adapter-pg', () => ({
    PrismaPg: class {
        constructor() {
            throw new Error('[tests] a Prisma driver adapter must never be constructed in a test');
        }
    },
}));

// The gate logs every refusal by design. Silence the three levels it uses so
// the run is readable, as spies so a test can still assert on what was logged.
// TEST_VERBOSE=1 keeps the output.
beforeEach(() => {
    resetPrisma();
    resetAuth();
    resetDirectory();
    resetEmail();
    resetHeaders();
    resetAfter();
    if (!process.env.TEST_VERBOSE) {
        vi.spyOn(console, 'info').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    }
});

afterEach(() => {
    vi.restoreAllMocks();
});
