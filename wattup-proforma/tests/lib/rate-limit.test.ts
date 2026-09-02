import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    checkEmailLimits,
    checkIpLimit,
    FailOpenStore,
    ipBucket,
    isMissingTable,
    LIMITS,
    MemoryRateLimitStore,
    PrismaRateLimitStore,
    rateLimitKey,
    type RateLimitStore,
} from '@/lib/rate-limit';

import { missingTableError } from '../mocks/prisma';

/**
 * lib/rate-limit.ts, the pure logic. Checklist 5.1 to 5.7, ADR 0001 section 10.
 *
 * Every counter runs on MemoryRateLimitStore with an injected clock, so a
 * "minute" and an "hour" are numbers rather than waits. The Postgres store is
 * tested against a fake queryable for its two contracts (the count it returns,
 * and a sweep that cannot undo a hit); its SQL is checklist 5.7a's live evidence.
 */

const EMAIL = 'member@hostproposal.test';
const IP_A = '203.0.113.7';
const IP_B = '198.51.100.9';
const MINUTE = 60 * 1000;
const GAP = LIMITS.gapSeconds * 1000 + 1000;

/** A clock the test advances. */
function clock(start = 1_000_000) {
    let t = start;
    return {
        now: () => t,
        advance(ms: number) {
            t += ms;
        },
    };
}

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('checkEmailLimits: per address', () => {
    it('allows five requests an hour from one source, refuses the sixth with reason email', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);

        for (let i = 1; i <= LIMITS.emailPerSourcePerWindow; i += 1) {
            await expect(checkEmailLimits(EMAIL, IP_A, store, c.now), `request ${i}`).resolves.toEqual({ allowed: true });
            c.advance(GAP);
        }

        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: false, reason: 'email' });
    });

    it('a second source for the same address is not refused by the first source having spent its five', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);

        for (let i = 0; i <= LIMITS.emailPerSourcePerWindow; i += 1) {
            await checkEmailLimits(EMAIL, IP_A, store, c.now);
            c.advance(GAP);
        }
        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: false, reason: 'email' });
        c.advance(GAP);

        await expect(checkEmailLimits(EMAIL, IP_B, store, c.now)).resolves.toEqual({ allowed: true });
    });

    it('the global ceiling refuses the twenty-first request for one address across sources, with reason email-global', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);
        const perSource = LIMITS.emailPerSourcePerWindow;
        const sources = LIMITS.emailGlobalPerWindow / perSource; // 4 sources x 5 = 20

        for (let s = 0; s < sources; s += 1) {
            for (let i = 0; i < perSource; i += 1) {
                await expect(checkEmailLimits(EMAIL, `10.0.${s}.1`, store, c.now), `source ${s} request ${i}`).resolves.toEqual({ allowed: true });
                c.advance(GAP);
            }
        }

        await expect(checkEmailLimits(EMAIL, '10.0.99.1', store, c.now)).resolves.toEqual({ allowed: false, reason: 'email-global' });
    });

    it('refuses a second request within sixty seconds with reason gap, and the gap refusal does not consume the hourly budget', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);
        const addressKey = rateLimitKey('email', EMAIL);

        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: true });
        const firstSend = await store.lastHit(addressKey);

        c.advance(30 * 1000);
        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: false, reason: 'gap' });
        // Nothing was counted: the gap marker is still the first send.
        expect(await store.lastHit(addressKey)).toEqual(firstSend);

        // Four more allowed sends complete the five; had the gap refusal
        // counted, the fifth here would already be the sixth.
        for (let i = 2; i <= LIMITS.emailPerSourcePerWindow; i += 1) {
            c.advance(GAP);
            await expect(checkEmailLimits(EMAIL, IP_A, store, c.now), `send ${i}`).resolves.toEqual({ allowed: true });
        }
        c.advance(GAP);
        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: false, reason: 'email' });
    });

    it('the gap is per address: another address is not held to it', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);

        await checkEmailLimits(EMAIL, IP_A, store, c.now);
        c.advance(1000);

        await expect(checkEmailLimits('other@hostproposal.test', IP_A, store, c.now)).resolves.toEqual({ allowed: true });
    });

    it('the hour window resets: the sixth request an hour later is allowed', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);

        for (let i = 0; i < LIMITS.emailPerSourcePerWindow; i += 1) {
            await checkEmailLimits(EMAIL, IP_A, store, c.now);
            c.advance(GAP);
        }
        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: false, reason: 'email' });

        c.advance(LIMITS.windowSeconds * 1000);
        await expect(checkEmailLimits(EMAIL, IP_A, store, c.now)).resolves.toEqual({ allowed: true });
    });
});

describe('checkIpLimit: per client address', () => {
    it("request-code's bucket allows twenty an hour and refuses the twenty-first with reason ip", async () => {
        const store = new MemoryRateLimitStore();

        for (let i = 1; i <= LIMITS.ipPerWindow; i += 1) {
            await expect(checkIpLimit(IP_A, 'request', store), `request ${i}`).resolves.toEqual({ allowed: true });
        }

        await expect(checkIpLimit(IP_A, 'request', store)).resolves.toEqual({ allowed: false, reason: 'ip' });
        await expect(checkIpLimit(IP_B, 'request', store)).resolves.toEqual({ allowed: true });
    });

    it("verify-code's bucket allows a hundred, separately from request-code's", async () => {
        const store = new MemoryRateLimitStore();

        for (let i = 0; i <= LIMITS.ipPerWindow; i += 1) await checkIpLimit(IP_A, 'request', store);
        await expect(checkIpLimit(IP_A, 'request', store)).resolves.toEqual({ allowed: false, reason: 'ip' });

        for (let i = 1; i <= LIMITS.ipVerifyPerWindow; i += 1) {
            await expect(checkIpLimit(IP_A, 'verify', store), `attempt ${i}`).resolves.toEqual({ allowed: true });
        }
        await expect(checkIpLimit(IP_A, 'verify', store)).resolves.toEqual({ allowed: false, reason: 'ip' });
    });

    it('defaults to the request bucket', async () => {
        const store = new MemoryRateLimitStore();
        for (let i = 0; i < LIMITS.ipPerWindow; i += 1) await checkIpLimit(IP_A, undefined, store);

        await expect(checkIpLimit(IP_A, undefined, store)).resolves.toEqual({ allowed: false, reason: 'ip' });
    });

    it('two IPv6 addresses in one /64 share a bucket', async () => {
        const store = new MemoryRateLimitStore();
        for (let i = 0; i < LIMITS.ipPerWindow; i += 1) await checkIpLimit('2001:db8:abcd:1234::1', 'request', store);

        await expect(checkIpLimit('2001:db8:abcd:1234:ffff:ffff:ffff:ffff', 'request', store)).resolves.toEqual({ allowed: false, reason: 'ip' });
        await expect(checkIpLimit('2001:db8:abcd:1235::1', 'request', store)).resolves.toEqual({ allowed: true });
    });
});

describe('ipBucket', () => {
    it.each([
        ['203.0.113.7', '203.0.113.7'],
        ['unknown', 'unknown'],
        ['2001:db8:abcd:1234::1', '2001:0db8:abcd:1234::/64'],
        ['2001:db8:abcd:1234:ffff:ffff:ffff:ffff', '2001:0db8:abcd:1234::/64'],
        ['2001:0db8:abcd:1234:0000:0000:0000:0001', '2001:0db8:abcd:1234::/64'],
        ['2001:db8::1', '2001:0db8:0000:0000::/64'],
        ['2001:0db8:0000:0000:0000:0000:0000:0001', '2001:0db8:0000:0000::/64'],
        ['::1', '0000:0000:0000:0000::/64'],
        ['2001:DB8:ABCD:1234::1', '2001:0db8:abcd:1234::/64'],
    ])('%s -> %s', (ip, bucket) => {
        expect(ipBucket(ip)).toBe(bucket);
    });
});

describe('rateLimitKey (checklist 5.6)', () => {
    it('is kind: plus a 64-hex HMAC that never contains the value', () => {
        const key = rateLimitKey('email', EMAIL);

        expect(key).toMatch(/^email:[0-9a-f]{64}$/);
        expect(key).not.toContain('member');
        expect(rateLimitKey('ip', IP_A)).not.toContain('203');
    });

    it('differs by kind and by secret, so rotating the secret orphans every row', () => {
        const before = rateLimitKey('email', EMAIL);
        expect(rateLimitKey('email-ip', EMAIL)).not.toBe(before);

        vi.stubEnv('BETTER_AUTH_SECRET', 'a-different-secret');
        expect(rateLimitKey('email', EMAIL)).not.toBe(before);
    });

    it('with no secret the key cannot be built, and the checks fail open rather than refuse', async () => {
        vi.stubEnv('BETTER_AUTH_SECRET', '');

        expect(() => rateLimitKey('email', EMAIL)).toThrow('BETTER_AUTH_SECRET');
        await expect(checkIpLimit(IP_A, 'request', new MemoryRateLimitStore())).resolves.toEqual({ allowed: true });
        await expect(checkEmailLimits(EMAIL, IP_A, new MemoryRateLimitStore())).resolves.toEqual({ allowed: true });
    });
});

describe('FailOpenStore (checklist 5.7, ADR 0001 section 10 rule 2)', () => {
    function failingPrimary(error: unknown = new Error('connection refused')): RateLimitStore & { hit: ReturnType<typeof vi.fn>; lastHit: ReturnType<typeof vi.fn> } {
        return {
            hit: vi.fn().mockRejectedValue(error),
            lastHit: vi.fn().mockRejectedValue(error),
        };
    }

    it('a throwing primary: the caller sees the memory count, and the request is allowed', async () => {
        const c = clock();
        const primary = failingPrimary();
        const store = new FailOpenStore(primary, new MemoryRateLimitStore(c.now), c.now);

        await expect(store.hit('k', LIMITS.windowSeconds)).resolves.toBe(1);
        await expect(store.hit('k', LIMITS.windowSeconds)).resolves.toBe(2);
        await expect(checkIpLimit(IP_A, 'request', store)).resolves.toEqual({ allowed: true });
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('stays on memory for a minute, then tries the primary again', async () => {
        const c = clock();
        const primary = failingPrimary();
        const store = new FailOpenStore(primary, new MemoryRateLimitStore(c.now), c.now);

        await store.hit('k', LIMITS.windowSeconds);
        c.advance(30 * 1000);
        await store.hit('k', LIMITS.windowSeconds);
        expect(primary.hit).toHaveBeenCalledTimes(1);

        c.advance(MINUTE);
        await store.hit('k', LIMITS.windowSeconds);
        expect(primary.hit).toHaveBeenCalledTimes(2);
    });

    it('a healthy primary answers, and memory is never consulted', async () => {
        const primary: RateLimitStore = { hit: vi.fn().mockResolvedValue(7), lastHit: vi.fn().mockResolvedValue(null) };
        const fallback = new MemoryRateLimitStore();
        const spy = vi.spyOn(fallback, 'hit');
        const store = new FailOpenStore(primary, fallback);

        await expect(store.hit('k', LIMITS.windowSeconds)).resolves.toBe(7);
        expect(spy).not.toHaveBeenCalled();
    });

    it('names the missing table when that is the failure', async () => {
        const store = new FailOpenStore(failingPrimary(missingTableError()), new MemoryRateLimitStore());

        await store.lastHit('k');

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('proforma_rate_limit table does not exist'),
            expect.any(Prisma.PrismaClientKnownRequestError),
        );
    });
});

describe('MemoryRateLimitStore', () => {
    it('counts within a window and starts over after it', async () => {
        const c = clock();
        const store = new MemoryRateLimitStore(c.now);

        await expect(store.hit('k', 60)).resolves.toBe(1);
        await expect(store.hit('k', 60)).resolves.toBe(2);
        c.advance(60 * 1000);
        await expect(store.hit('k', 60)).resolves.toBe(1);
    });

    it('lastHit is the last hit, or null for an unknown key', async () => {
        const c = clock(5_000);
        const store = new MemoryRateLimitStore(c.now);

        await expect(store.lastHit('k')).resolves.toBeNull();
        await store.hit('k', 60);
        await expect(store.lastHit('k')).resolves.toEqual(new Date(5_000));
    });

    it('is bounded: at ten thousand keys the oldest is evicted for the next new one', async () => {
        const store = new MemoryRateLimitStore();
        const cap = 10_000;

        for (let i = 0; i < cap; i += 1) await store.hit(`k${i}`, 3600);
        await expect(store.lastHit('k0')).resolves.not.toBeNull();

        await store.hit('overflow', 3600);

        await expect(store.lastHit('k0')).resolves.toBeNull();
        await expect(store.lastHit('k1')).resolves.not.toBeNull();
        await expect(store.hit('k1', 3600)).resolves.toBe(2);
    });
});

describe('PrismaRateLimitStore against a fake queryable', () => {
    function fakeDb(rows: unknown[]) {
        return {
            $queryRaw: vi.fn().mockResolvedValue(rows),
            $executeRaw: vi.fn().mockResolvedValue(0),
        };
    }

    it('hit returns the count the upsert returned', async () => {
        const db = fakeDb([{ count: 3 }]);
        const store = new PrismaRateLimitStore(db as unknown as ConstructorParameters<typeof PrismaRateLimitStore>[0]);

        await expect(store.hit('k', 3600)).resolves.toBe(3);
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('hit throws when the upsert returns no count, so the fail-open wrapper sees a failure rather than a fake zero', async () => {
        const store = new PrismaRateLimitStore(fakeDb([]) as unknown as ConstructorParameters<typeof PrismaRateLimitStore>[0]);

        await expect(store.hit('k', 3600)).rejects.toThrow('upsert returned no count');
    });

    it('a failing sweep does not undo the hit', async () => {
        const db = fakeDb([{ count: 1 }]);
        db.$executeRaw.mockRejectedValue(new Error('sweep failed'));
        const store = new PrismaRateLimitStore(db as unknown as ConstructorParameters<typeof PrismaRateLimitStore>[0]);

        await expect(store.hit('k', 3600)).resolves.toBe(1);
        expect(db.$executeRaw).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('[rate-limit] sweep failed', { message: 'sweep failed' });
    });

    it('lastHit is the row value, or null', async () => {
        const when = new Date('2026-09-03T10:00:00Z');
        const db = fakeDb([{ lastHit: when }]);
        const store = new PrismaRateLimitStore(db as unknown as ConstructorParameters<typeof PrismaRateLimitStore>[0]);

        await expect(store.lastHit('k')).resolves.toEqual(when);
        db.$queryRaw.mockResolvedValue([]);
        await expect(store.lastHit('k')).resolves.toBeNull();
    });
});

describe('isMissingTable', () => {
    const known = (code: string, meta?: Record<string, unknown>) =>
        new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 'test', meta });

    it.each([
        ['P2021 from a typed query', known('P2021'), true],
        ['P2010 with a TableDoesNotExist cause', known('P2010', { driverAdapterError: { cause: { kind: 'TableDoesNotExist' } } }), true],
        ['P2010 with SQLSTATE 42P01', known('P2010', { driverAdapterError: { cause: { originalCode: '42P01' } } }), true],
        ['P2010 with another cause', known('P2010', { driverAdapterError: { cause: { kind: 'ConnectionClosed' } } }), false],
        ['P2010 with no meta', known('P2010'), false],
        ['P2002', known('P2002'), false],
        ['a plain Error', new Error('relation does not exist'), false],
        ['not an error', 'P2021', false],
    ])('%s -> %s', (_label, error, expected) => {
        expect(isMissingTable(error)).toBe(expected);
    });
});
