import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Finding F10, checklist 4a.40: public sign-up is refused by two independent layers,
 * and each is exercised on its own.
 *
 *   1. emailAndPassword.disableSignUp, Better Auth's own switch, which the server-side
 *      API call hits (no request object, so the hook below never runs).
 *   2. The before hook matching /sign-up/email, which the HTTP handler hits first.
 *
 * Neither reaches the database: the Prisma singleton and the mailer are stubbed with
 * objects that throw if anything touches them.
 */

const untouchable = (name: string) =>
    new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'then') return undefined;
                throw new Error(`${name}.${String(prop)} was touched by a sign-up attempt`);
            },
        }
    );

vi.mock('@/lib/prisma', () => ({ default: untouchable('prisma') }));
vi.mock('@/lib/email', () => ({
    sendMail: () => {
        throw new Error('sendMail was called by a sign-up attempt');
    },
}));

process.env.BETTER_AUTH_SECRET ??= 'test-secret-that-is-long-enough-for-better-auth';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';

type Auth = typeof import('@/lib/auth').auth;
let auth: Auth;

beforeAll(async () => {
    ({ auth } = await import('@/lib/auth'));
});

const body = { email: 'stranger@example.com', password: 'a-long-enough-password', name: 'Stranger' };

describe('public sign-up is closed', () => {
    it('layer 1: the server API refuses because disableSignUp is on', async () => {
        await expect(auth.api.signUpEmail({ body })).rejects.toMatchObject({
            status: 'BAD_REQUEST',
        });
    });

    it('layer 2: the HTTP handler refuses with 403 from the before hook', async () => {
        const response = await auth.handler(
            new Request('http://localhost:3000/api/auth/sign-up/email', {
                method: 'POST',
                headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
                body: JSON.stringify(body),
            })
        );
        expect(response.status).toBe(403);
        const payload = (await response.json()) as { message?: string };
        expect(payload.message).toMatch(/registration is disabled/i);
    });
});
