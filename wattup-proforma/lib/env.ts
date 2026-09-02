/**
 * Fail closed on configuration. Checklist 2.9.
 *
 * lib/auth.ts throws at import when BETTER_AUTH_SECRET is missing, which a route
 * handler surfaces as an opaque 500. The gate routes want the opposite of opaque:
 * a misconfigured deployment must say so, plainly, before anything else runs.
 * Both routes call missingRequiredEnv() first and answer 503 naming what is
 * missing, and only then import lib/auth, so the module-level throw can never
 * pre-empt the 503.
 *
 * An empty string counts as missing. `RESEND_API_KEY=` in a .env file is the
 * commonest way for a variable to be "set" and useless.
 */

export const REQUIRED_ENV = [
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
    'RESEND_API_KEY',
    'MAIL_FROM',
] as const;

// Optional numerics. When set, they must be positive integers: `Number('6O0')`
// is NaN, and NaN as a session lifetime is not a 503 by itself, it is a session
// that never expires or never starts. Reported in the same 503.
const POSITIVE_INT_ENV = ['SESSION_TTL_DAYS', 'OTP_TTL_SECONDS'] as const;

export function missingRequiredEnv(): string[] {
    const missing: string[] = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
    for (const name of POSITIVE_INT_ENV) {
        const raw = process.env[name];
        if (raw === undefined || raw.trim() === '') continue;
        if (!/^[1-9]\d*$/.test(raw.trim())) missing.push(`${name} (must be a positive integer, got ${JSON.stringify(raw)})`);
    }
    return missing;
}
