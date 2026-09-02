import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The dashboard's own sign-in events (checklist 4b.6).
 *
 * The pro-forma app has written its sign-ins to activity_log since phase 4b; the
 * dashboard wrote every user and permission change but not its own, so the sign-in
 * history on a person's page showed only half their life. These two hooks close that.
 *
 * They are driven here through `auth.options`, which is the same object Better Auth
 * calls at runtime, rather than through a fake of their shape. Two things are pinned:
 * what a row contains, and that a failure to write one can never turn a sign-in into a
 * 500. The second is not hypothetical: the first version of this hook did exactly that,
 * and the wrapping is what these tests defend.
 */

const { prisma, logActivity } = vi.hoisted(() => ({
    prisma: { user: { findUnique: vi.fn() } },
    logActivity: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/activity-log', async () => {
    const actual = await vi.importActual<typeof import('@/lib/activity-log')>('@/lib/activity-log');
    return { ...actual, logActivity };
});
vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }));

process.env.BETTER_AUTH_SECRET ??= 'test-secret-that-is-long-enough-for-better-auth';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';

let auth: typeof import('@/lib/auth').auth;
let APIError: typeof import('better-auth/api').APIError;

beforeEach(async () => {
    vi.clearAllMocks();
    ({ auth } = await import('@/lib/auth'));
    ({ APIError } = await import('better-auth/api'));
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'someone@wattupusa.com' });
});

/** The hook Better Auth calls when a session row is created, that is, on a sign-in. */
const sessionHook = () => auth.options.databaseHooks!.session!.create!.after!;

function request(headers: Record<string, string> = {}) {
    return new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: new Headers({ 'user-agent': 'Vitest', ...headers }),
    });
}

describe('signin.success', () => {
    it('records the user, taking the address from the request rather than the session row', async () => {
        // Better Auth stores the address on the session in its expanded form. Taking it
        // from there wrote 0000:0000:...:0001 beside the ::1 a refusal recorded: one
        // address, two spellings, in a table a person reads down.
        await sessionHook()(
            { userId: 'u1', ipAddress: '0000:0000:0000:0000:0000:0000:0000:0001' } as never,
            { request: request({ 'x-forwarded-for': '203.0.113.7' }) } as never
        );

        expect(logActivity).toHaveBeenCalledTimes(1);
        const [entry, context] = logActivity.mock.calls[0];
        expect(entry).toEqual({
            event: 'signin.success',
            target: { id: 'u1', email: 'someone@wattupusa.com' },
        });
        expect(context).toEqual({ ipAddress: '203.0.113.7', userAgent: 'Vitest' });
    });

    it('falls back to the session row when there is no request, as for a seed', async () => {
        await sessionHook()(
            { userId: 'u1', ipAddress: '198.51.100.4', userAgent: 'Seeder' } as never,
            null as never
        );

        expect(logActivity.mock.calls[0][1]).toEqual({ ipAddress: '198.51.100.4', userAgent: 'Seeder' });
    });

    it('writes nothing for a session with no user id', async () => {
        await sessionHook()({ ipAddress: '::1' } as never, null as never);
        expect(logActivity).not.toHaveBeenCalled();
    });

    it('writes nothing when the user has since gone', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await sessionHook()({ userId: 'ghost' } as never, null as never);
        expect(logActivity).not.toHaveBeenCalled();
    });

    it('never lets an audit failure break the sign-in', async () => {
        logActivity.mockRejectedValue(new Error('activity_log is gone'));

        await expect(
            sessionHook()({ userId: 'u1' } as never, null as never)
        ).resolves.toBeUndefined();
    });

    it('never lets a failed user lookup break the sign-in', async () => {
        prisma.user.findUnique.mockRejectedValue(new Error('connection lost'));

        await expect(
            sessionHook()({ userId: 'u1' } as never, null as never)
        ).resolves.toBeUndefined();
    });
});

describe('the hooks are actually wired', () => {
    it('a session-create hook and a request-after hook are both configured', () => {
        // If either disappears in a refactor the events stop silently, and nothing else
        // in the suite would notice.
        expect(typeof auth.options.databaseHooks?.session?.create?.after).toBe('function');
        expect(typeof auth.options.hooks?.after).toBe('function');
        expect(typeof auth.options.hooks?.before).toBe('function');
    });

    it('keeps the two settings that close public sign-up', () => {
        expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
    });
});

describe('signin.failed', () => {
    /**
     * The refusal hook is a Better Auth middleware, so it is invoked the way Better Auth
     * invokes it: with the endpoint context on `context`, carrying what the handler
     * returned. An APIError there is a refusal; anything else is a success the session
     * hook has already recorded.
     */
    const afterHook = () => auth.options.hooks!.after! as unknown as (ctx: unknown) => Promise<void>;

    const ctx = (returned: unknown, body: unknown = { email: 'someone@wattupusa.com' }) => ({
        request: request({ 'x-forwarded-for': '203.0.113.9' }),
        body,
        context: { returned },
        // better-call's middleware wrapper reads these off the input context.
        headers: new Headers(),
        method: 'POST',
        path: '/sign-in/email',
    });

    it('records a refusal with the address that was offered and the status', async () => {
        await afterHook()(ctx(new APIError('UNAUTHORIZED', { message: 'no' })));

        expect(logActivity).toHaveBeenCalledTimes(1);
        const [entry, context] = logActivity.mock.calls[0];
        expect(entry).toMatchObject({
            event: 'signin.failed',
            target: { id: 'u1', email: 'someone@wattupusa.com' },
            meta: { status: 'UNAUTHORIZED' },
        });
        expect(context).toEqual({ ipAddress: '203.0.113.9', userAgent: 'Vitest' });
    });

    it('records a refusal for an address with no account, with no user id', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await afterHook()(ctx(new APIError('UNAUTHORIZED', { message: 'no' })));

        expect(logActivity.mock.calls[0][0].target).toEqual({
            id: null,
            email: 'someone@wattupusa.com',
        });
    });

    it('records nothing when the endpoint succeeded', async () => {
        await afterHook()(ctx({ token: 'a-session' }));
        expect(logActivity).not.toHaveBeenCalled();
    });

    it('records nothing when the body carried no address', async () => {
        await afterHook()(ctx(new APIError('UNAUTHORIZED', { message: 'no' }), {}));
        expect(logActivity).not.toHaveBeenCalled();
    });
});
