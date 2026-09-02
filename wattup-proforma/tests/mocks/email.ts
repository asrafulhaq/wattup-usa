import { vi } from 'vitest';

/**
 * The stand-in for lib/email.ts. No Resend client exists here: sendOtpEmail is
 * a vi.fn that resolves, and tests/setup.ts additionally replaces the `resend`
 * package with a constructor that throws, so a send could not happen even if
 * something bypassed this module.
 *
 * maskEmail is copied from lib/email.ts rather than imported from it, because
 * importing the real module would load the Resend SDK.
 */

export const sendOtpEmail = vi.fn<(mail: { email: string; otp: string; type: string }) => Promise<void>>();

export function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    return `${user.slice(0, 2)}***@${domain}`;
}

export function resetEmail(): void {
    sendOtpEmail.mockReset().mockResolvedValue(undefined);
}

resetEmail();
