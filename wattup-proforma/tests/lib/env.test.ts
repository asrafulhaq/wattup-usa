import { afterEach, describe, expect, it, vi } from 'vitest';

import { missingRequiredEnv, REQUIRED_ENV } from '@/lib/env';

/**
 * lib/env.ts: the fail-closed configuration check both gate routes run first.
 * Checklist 2.9. tests/setup.ts sets every required name, so the baseline is
 * "nothing missing" and each case removes or breaks one thing.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('missingRequiredEnv', () => {
    it('reports nothing for the test environment', () => {
        expect(missingRequiredEnv()).toEqual([]);
    });

    it.each(REQUIRED_ENV)('%s unset is reported', (name) => {
        vi.stubEnv(name, undefined);

        expect(missingRequiredEnv()).toEqual([name]);
    });

    it.each(REQUIRED_ENV)('%s empty is reported: RESEND_API_KEY= is the commonest way to be "set" and useless', (name) => {
        vi.stubEnv(name, '');

        expect(missingRequiredEnv()).toEqual([name]);
    });

    it('whitespace is empty', () => {
        vi.stubEnv('MAIL_FROM', '   ');

        expect(missingRequiredEnv()).toEqual(['MAIL_FROM']);
    });

    it('lists every missing name, in the declared order', () => {
        for (const name of REQUIRED_ENV) vi.stubEnv(name, undefined);

        expect(missingRequiredEnv()).toEqual([...REQUIRED_ENV]);
    });

    it.each([
        ['SESSION_TTL_DAYS', 'abc'],
        ['SESSION_TTL_DAYS', '6O0'],
        ['SESSION_TTL_DAYS', '-1'],
        ['SESSION_TTL_DAYS', '1.5'],
        ['OTP_TTL_SECONDS', '0'],
        ['OTP_TTL_SECONDS', '00'],
        ['OTP_TTL_SECONDS', 'NaN'],
    ])('%s=%j is reported as not a positive integer, quoting the value', (name, value) => {
        vi.stubEnv(name, value);

        expect(missingRequiredEnv()).toEqual([`${name} (must be a positive integer, got ${JSON.stringify(value)})`]);
    });

    it.each([
        ['SESSION_TTL_DAYS', '7'],
        ['SESSION_TTL_DAYS', ' 7 '],
        ['OTP_TTL_SECONDS', '600'],
        ['OTP_TTL_SECONDS', '20'],
        ['OTP_TTL_SECONDS', ''],
    ])('%s=%j is fine', (name, value) => {
        vi.stubEnv(name, value);

        expect(missingRequiredEnv()).toEqual([]);
    });

    it('reports a missing name and a bad number together', () => {
        vi.stubEnv('DATABASE_URL', '');
        vi.stubEnv('OTP_TTL_SECONDS', 'ten');

        expect(missingRequiredEnv()).toEqual(['DATABASE_URL', 'OTP_TTL_SECONDS (must be a positive integer, got "ten")']);
    });
});
