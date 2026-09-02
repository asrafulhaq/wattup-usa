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

export function missingRequiredEnv(): string[] {
    return REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
}
