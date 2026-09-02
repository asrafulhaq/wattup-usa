import { vi } from 'vitest';

import type { Session } from '@/lib/auth';

/**
 * The stand-in for lib/auth.ts: the four auth.api methods the gate calls, as
 * vi.fn a test scripts. Better Auth itself is never constructed, so no adapter,
 * no database and no plugin code runs. The one test that needs the real module
 * (tests/lib/auth-config.test.ts) reaches it with vi.importActual and mocks the
 * better-auth packages instead.
 *
 * Defaults, restored before every test by resetAuth():
 *   getSession          -> null                       (signed out)
 *   sendVerificationOTP -> { success: true }
 *   signInEmailOTP      -> rejects "not scripted"     (a test must say what
 *                                                      Better Auth answers)
 *   signOut             -> { success: true }
 */

type OtpType = 'sign-in' | 'email-verification' | 'forget-password';

export type GetSession = (input: { headers: Headers; query?: { disableCookieCache?: boolean } }) => Promise<Session | null>;
export type SendVerificationOTP = (input: { body: { email: string; type: OtpType } }) => Promise<{ success: boolean }>;
export type SignInEmailOTP = (input: {
    body: { email: string; otp: string };
    headers: Headers;
    returnHeaders: true;
}) => Promise<{ headers: Headers; response: unknown }>;
export type SignOut = (input: { headers: Headers }) => Promise<{ success: boolean }>;

export const auth = {
    api: {
        getSession: vi.fn<GetSession>(),
        sendVerificationOTP: vi.fn<SendVerificationOTP>(),
        signInEmailOTP: vi.fn<SignInEmailOTP>(),
        signOut: vi.fn<SignOut>(),
    },
};

export function resetAuth(): void {
    auth.api.getSession.mockReset().mockResolvedValue(null);
    auth.api.sendVerificationOTP.mockReset().mockResolvedValue({ success: true });
    auth.api.signInEmailOTP.mockReset().mockRejectedValue(new Error('[tests] auth.api.signInEmailOTP was not scripted'));
    auth.api.signOut.mockReset().mockResolvedValue({ success: true });
}

resetAuth();
