import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Finding F10, checklist 4a.40: public sign-up is refused by two independent layers,
 * and each is exercised on its own.
 *
 *   1. emailAndPassword.disableSignUp, Better Auth's own switch, which the server-side
 *      API call hits (no request object, so the hook below never runs).
 *   2. The before hook matching /sign-up/email, which the HTTP handler hits first.
 *
 * Neither reaches a user, account or session row: the Prisma singleton is stubbed with
 * an object that throws if anything but the rate limiter is touched, and the mailer
 * with one that throws outright.
 *
 * The one model that IS reachable is `rateLimit`. Since checklist B.10 the limiter
 * stores its counters in Postgres (`auth_rate_limit`), and on the HTTP path it runs
 * before any route handler, so a sign-up attempt legitimately reads and writes that
 * table before either layer below refuses it. Letting the stub serve it, rather than
 * throwing, keeps the assertion pointed at what matters: no identity row is read and
 * no mail is sent.
 */

const untouchable = (name: string, allow: Record<string, unknown> = {}) =>
    new Proxy(allow, {
        get(target, prop) {
            if (prop === 'then') return undefined;
            if (prop in target) return target[prop as string];
            throw new Error(`${name}.${String(prop)} was touched by a sign-up attempt`);
        },
    });

// The limiter's own storage, in memory: findMany, create, findFirst, update, deleteMany
// are the five calls better-auth/dist/api/rate-limiter makes against this model.
const rateLimitRows: Record<string, unknown>[] = [];
const rateLimit = {
    findMany: async () => [...rateLimitRows],
    findFirst: async () => rateLimitRows[0] ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `rl_${rateLimitRows.length + 1}`, ...data };
        rateLimitRows.push(row);
        return row;
    },
    update: async ({ data }: { data: Record<string, unknown> }) => ({ ...rateLimitRows[0], ...data }),
    updateMany: async () => ({ count: 0 }),
    deleteMany: async () => ({ count: 0 }),
};

vi.mock('@/lib/prisma', () => ({ default: untouchable('prisma', { rateLimit }) }));
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
