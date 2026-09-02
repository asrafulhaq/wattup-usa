import { createHash, createHmac } from 'node:crypto';

import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendOtpEmail } from '../mocks/email';
import { after, runAfterCallbacks } from '../mocks/next-server';

/**
 * What lib/auth.ts hands Better Auth. Checklist 5.14, our side of it.
 *
 * The four behaviours 5.14 names (five attempts, ten minute expiry, no reuse,
 * and rotation on resend) are Better Auth's verification store honouring the
 * options below. They were proven live with real codes (checklist 2.43 to
 * 2.45) and cannot be reproduced without that store; what CAN regress silently
 * is the configuration that asks for them, so that is what is pinned here.
 *
 * The better-auth packages are replaced with recorders, so the real lib/auth.ts
 * runs (vi.importActual, past the setup-wide mock) and what it passes to
 * betterAuth() and emailOTP() is read back. Nothing of Better Auth executes.
 *
 * The module reads the environment when it is evaluated, so each test that
 * changes the environment evaluates it afresh under a distinct module id
 * (`@/lib/auth?variant=n`); its imports resolve to the same mock instances
 * this file holds, which is what makes the after() and send assertions work.
 */

vi.mock('better-auth', () => ({
    betterAuth: vi.fn((options: unknown) => ({ options, api: {}, handler: async () => new Response(null), $Infer: {} })),
}));
vi.mock('better-auth/plugins', () => ({
    emailOTP: vi.fn((options: unknown) => ({ id: 'email-otp', options })),
}));
vi.mock('better-auth/adapters/prisma', () => ({
    prismaAdapter: vi.fn(() => ({ id: 'prisma' })),
}));
vi.mock('better-auth/next-js', () => ({
    nextCookies: vi.fn(() => ({ id: 'next-cookies' })),
}));

type OtpMail = { email: string; otp: string; type: 'sign-in' | 'email-verification' | 'forget-password' };

type EmailOtpOptions = {
    otpLength: number;
    expiresIn: number;
    allowedAttempts: number;
    disableSignUp: boolean;
    resendStrategy: string;
    storeOTP: { hash: (otp: string) => Promise<string> };
    sendVerificationOTP: (mail: OtpMail) => Promise<void>;
};

type AuthOptions = {
    secret: string;
    baseURL: string;
    emailAndPassword: { enabled: boolean };
    session: { expiresIn: number; updateAge: number; cookieCache: { enabled: boolean; maxAge: number } };
    advanced: { useSecureCookies: boolean; cookiePrefix: string; database: { generateId: boolean } };
    trustedOrigins: string[];
    plugins: { id: string }[];
};

let variant = 0;

/** Evaluate lib/auth.ts afresh under the current environment and read back what it configured. */
async function load() {
    vi.mocked(betterAuth).mockClear();
    vi.mocked(emailOTP).mockClear();
    variant += 1;
    await vi.importActual<typeof import('@/lib/auth')>(`@/lib/auth?variant=${variant}`);

    const authOptions = vi.mocked(betterAuth).mock.calls[0]?.[0] as unknown as AuthOptions | undefined;
    const otpOptions = vi.mocked(emailOTP).mock.calls[0]?.[0] as unknown as EmailOtpOptions | undefined;
    if (!authOptions || !otpOptions) throw new Error('[tests] lib/auth.ts did not configure Better Auth');
    return { authOptions, otpOptions };
}

const SECRET = process.env.BETTER_AUTH_SECRET ?? '';
const OTP = '123456';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('emailOTP options (AGENTS.md: four defaults that are wrong here)', () => {
    it('six digits, 600 s, five attempts, no sign-up, rotate on resend', async () => {
        const { otpOptions } = await load();

        expect(otpOptions).toMatchObject({
            otpLength: 6,
            expiresIn: 600,
            allowedAttempts: 5,
            disableSignUp: true,
            resendStrategy: 'rotate',
        });
    });

    it('OTP_TTL_SECONDS sets the code life (checklist 2.44 was measured with 20)', async () => {
        vi.stubEnv('OTP_TTL_SECONDS', '20');

        const { otpOptions } = await load();

        expect(otpOptions.expiresIn).toBe(20);
    });

    it('stores a keyed HMAC of the code under this app secret: never the code, never an unkeyed hash', async () => {
        const { otpOptions } = await load();

        const stored = await otpOptions.storeOTP.hash(OTP);

        expect(stored).toBe(createHmac('sha256', SECRET).update(OTP).digest('base64url'));
        expect(stored).not.toBe(OTP);
        expect(stored).not.toBe(createHash('sha256').update(OTP).digest('base64url'));
        expect(stored).not.toBe(createHash('sha256').update(OTP).digest('hex'));
        expect(stored).not.toBe(createHmac('sha256', 'some-other-secret').update(OTP).digest('base64url'));
    });
});

describe('sendVerificationOTP: the mail leaves the response path (checklist 2.42)', () => {
    const mail: OtpMail = { email: 'member@hostproposal.test', otp: OTP, type: 'sign-in' };

    it('schedules the send with after() and returns before anything is sent', async () => {
        const { otpOptions } = await load();

        await otpOptions.sendVerificationOTP(mail);

        expect(after).toHaveBeenCalledTimes(1);
        expect(sendOtpEmail).not.toHaveBeenCalled();

        await runAfterCallbacks();

        expect(sendOtpEmail).toHaveBeenCalledTimes(1);
        expect(sendOtpEmail).toHaveBeenCalledWith(mail);
    });

    it('outside a request, where after() throws, sends inline rather than losing the code', async () => {
        const { otpOptions } = await load();
        after.mockImplementationOnce(() => {
            throw new Error('`after` was called outside a request scope');
        });

        await otpOptions.sendVerificationOTP(mail);

        expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    });

    it('logs a send failure with a masked address, and the code appears nowhere', async () => {
        const { otpOptions } = await load();
        sendOtpEmail.mockRejectedValue(new Error('Resend validation_error: bad sender'));

        await otpOptions.sendVerificationOTP(mail);
        await expect(runAfterCallbacks()).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith('[mail] OTP send failed', {
            to: 'me***@hostproposal.test',
            message: 'Resend validation_error: bad sender',
        });
        expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(OTP);
    });
});

describe('betterAuth options', () => {
    it('no passwords, seven-day sessions, a five minute cookie cache, the wup prefix, app-generated ids', async () => {
        const { authOptions } = await load();

        expect(authOptions.secret).toBe(SECRET);
        expect(authOptions.baseURL).toBe('https://hostproposal.test');
        expect(authOptions.emailAndPassword).toEqual({ enabled: false });
        expect(authOptions.session).toEqual({
            expiresIn: 7 * 24 * 60 * 60,
            updateAge: 24 * 60 * 60,
            cookieCache: { enabled: true, maxAge: 5 * 60 },
        });
        expect(authOptions.advanced).toMatchObject({ cookiePrefix: 'wup', database: { generateId: false } });
        expect(authOptions.trustedOrigins).toEqual(['https://hostproposal.test']);
        // nextCookies must be the last plugin (its own guard warns otherwise).
        expect(authOptions.plugins.map((plugin) => plugin.id)).toEqual(['email-otp', 'next-cookies']);
    });

    it('SESSION_TTL_DAYS sets the session life, in days', async () => {
        vi.stubEnv('SESSION_TTL_DAYS', '3');

        const { authOptions } = await load();

        expect(authOptions.session.expiresIn).toBe(3 * 24 * 60 * 60);
    });

    it('a Vercel preview host is a trusted origin, so the tool sign-out POST passes there', async () => {
        vi.stubEnv('VERCEL_URL', 'wattup-proforma-abc123.vercel.app');

        const { authOptions } = await load();

        expect(authOptions.trustedOrigins).toEqual(['https://hostproposal.test', 'https://wattup-proforma-abc123.vercel.app']);
    });

    it('a missing BETTER_AUTH_SECRET fails the module at import: the gate never runs unsigned', async () => {
        vi.stubEnv('BETTER_AUTH_SECRET', '');

        await expect(load()).rejects.toThrow('[auth] Missing required environment variable: BETTER_AUTH_SECRET');
    });
});

describe('what only Better Auth can prove (checklist 5.14, verified live in 2.43 to 2.45)', () => {
    it.todo('the fifth wrong attempt destroys the record, and the right code then fails (2.43, allowedAttempts: 5)');
    it.todo('a code older than OTP_TTL_SECONDS is refused (2.44, measured at 20 s with a real code)');
    it.todo('a used code cannot be reused (2.44)');
    it.todo('a second request rotates the first code out: first 400, second 200 (2.45, resendStrategy: rotate)');
});
