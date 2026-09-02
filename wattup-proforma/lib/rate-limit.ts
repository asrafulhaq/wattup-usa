import { createHmac } from 'node:crypto';

import { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';

/**
 * Rate limits for the gate routes. Checklist 5.1 to 5.7, ADR 0001 section 10.
 *
 * Three limits, all from the PRD, all on request-code:
 *
 *   per address+source  5 code requests per hour      checkEmailLimits, reason 'email'
 *   per address, global 20 code requests per hour     checkEmailLimits, reason 'email-global'
 *   per IP (request)    20 code requests per hour     checkIpLimit,     reason 'ip'
 *   per IP (verify)     100 attempts per hour         checkIpLimit,     reason 'ip'
 *   gap                 60 seconds between sends      checkEmailLimits, reason 'gap'
 *                 address, rolling
 *
 * The fourth PRD limit, 5 verify attempts per code, is Better Auth's own
 * allowedAttempts in lib/auth.ts and is not reimplemented here.
 *
 * WHERE EACH COUNTER IS HIT, AND WHY THE ORDER MATTERS
 *
 * Both checks run inside request-code's after(), so the caller has already
 * received the generic 200 and nothing here is observable (checklist 5.5). What
 * the order decides is which requests COUNT, and the rule is that a counter is
 * hit only by a request that would otherwise proceed past it:
 *
 *   after(): checkIpLimit -> directory lookup -> checkEmailLimits -> Better Auth
 *
 *   1. The IP counter is hit BEFORE the directory lookup. A request for an
 *      address that is not a member is a probe, and probes are exactly what
 *      the per-IP limit exists to count. Twenty requests from one address in
 *      an hour is the ceiling whoever they were for.
 *   2. The address counters are hit AFTER the directory lookup, for members
 *      only. A non-member's request sends nothing, so there is no send to
 *      space out and nothing to count against that address; and not writing a
 *      row per probed address keeps the table to one row per member plus one
 *      per client IP, rather than one per string anyone cares to post.
 *   3. Within checkEmailLimits the gap is read before the hour counter is hit,
 *      so a request refused for the gap costs nothing from the hour budget: a
 *      member who double-clicks "send a new code" has spent one of five, not
 *      two. One row serves both: its lastHit is the gap marker (the PRD's
 *      rl:gap key) and its count the hour counter (rl:req). Two concurrent
 *      requests for one address can both read a stale lastHit and both send;
 *      Better Auth's resendStrategy 'rotate' makes the second code the only
 *      valid one, so the race is accepted rather than serialised.
 *
 * KEYS
 *
 * Every counter is keyed on `kind:` + HMAC-SHA256(BETTER_AUTH_SECRET, value),
 * hex, never the raw address or IP (checklist 5.6). The table holds nothing
 * that identifies anyone, and rotating the secret orphans every row, which the
 * sweep then removes.
 *
 * FAIL OPEN
 *
 * The identity check (lib/gate.ts requireMember) fails closed: no answer is no
 * membership. This module is the opposite, on purpose, and ADR 0001 section 10
 * says why: the limiter is defence in depth behind a code that is already six
 * random digits, five attempts and a ten minute life, and a limiter that fails
 * closed turns its own outage into the whole team's lockout. So when the
 * Postgres store throws, for any reason, including the table not having been
 * migrated yet, it is reported once per process, the in-memory store carries
 * the limits for the next minute, and the request continues. checkIpLimit and
 * checkEmailLimits never throw: an error that escapes even that is logged and
 * answered `allowed`. Checklist 5.7.
 *
 * WHERE THE COUNTERS LIVE
 *
 * proforma_rate_limit, one row per key, declared by wattup-frontend (the schema
 * owner) and mirrored in prisma/schema.prisma here. A fixed window per row:
 * count and windowStart, reset in the same statement that increments them, so
 * two instances hitting one key never race the reset. Rows whose lastHit is
 * older than any window are swept every ten minutes per process. The memory
 * store is a Map with the same semantics, and on serverless it is per
 * instance: two instances are two independent counters, and a cold start
 * empties it. It is a degraded backstop, never the design.
 */

export const LIMITS = {
    /** Code requests per address per hour. */
    // Per address AND source: one IP cannot spend a member's whole hourly budget.
    emailPerSourcePerWindow: 5,
    // Global ceiling per address across all sources, so many IPs still cannot
    // flood one inbox (the 60 s gap bounds it at 60/hour; this is lower).
    emailGlobalPerWindow: 20,
    /** Code requests per client IP per hour. */
    ipPerWindow: 20,
    // verify-code's own bucket, far higher: Better Auth's five attempts per code
    // are the brute-force bound; this only caps timing-sample volume. Sharing
    // request-code's bucket had halved every NAT's capacity (security review).
    ipVerifyPerWindow: 100,
    /** The window for both counters, in seconds. */
    windowSeconds: 60 * 60,
    /** Minimum gap between two sends to one address, in seconds. */
    gapSeconds: 60,
} as const;

// A row whose lastHit is older than this is outside every window and every gap.
const RETENTION_SECONDS = 2 * LIMITS.windowSeconds;

// How often one process sweeps expired rows, and how long it stays on the
// memory store after the Postgres store has failed before trying it again.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const RETRY_PRIMARY_AFTER_MS = 60 * 1000;

export type LimitReason = 'ip' | 'email' | 'email-global' | 'gap';

export type RequestLimitResult = { allowed: true } | { allowed: false; reason: LimitReason };

/**
 * What a store has to be able to do: count hits in a fixed window, and say
 * when a key was last hit. hit() returns the count for the window that
 * includes this hit, so the first hit in a window is 1.
 */
export interface RateLimitStore {
    hit(key: string, windowSeconds: number): Promise<number>;
    lastHit(key: string): Promise<Date | null>;
}

/** The subset of the Prisma client the Postgres store needs, so a transaction client will do. */
type RawQueryable = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>;

/**
 * The counters in proforma_rate_limit.
 *
 * hit() is one statement: insert the row, or on conflict either reset it (the
 * window has elapsed) or increment it, and return the count. The reset and the
 * increment being one UPDATE is what makes two instances safe against each
 * other. Timestamps are written and compared as UTC explicitly, so the stored
 * value means the same thing whatever the session time zone, and reads back
 * as the Date Prisma assumes it to be.
 *
 * The table may not exist yet: wattup-frontend applies the migration, and this
 * app never does. That surfaces as P2010 with a TableDoesNotExist cause for a
 * raw query (measured; a typed query would be P2021), and like every other
 * failure it is the FailOpenStore's problem, not a caller's.
 */
export class PrismaRateLimitStore implements RateLimitStore {
    private lastSweep = 0;

    constructor(
        private readonly db: RawQueryable = prisma,
        private readonly now: () => number = Date.now,
    ) {}

    async hit(key: string, windowSeconds: number): Promise<number> {
        const rows = await this.db.$queryRaw<{ count: number }[]>`
            INSERT INTO "proforma_rate_limit" ("key", "count", "windowStart", "lastHit")
            VALUES (${key}, 1, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'))
            ON CONFLICT ("key") DO UPDATE SET
                "count" = CASE
                    WHEN "proforma_rate_limit"."windowStart" <= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}::int)
                    THEN 1
                    ELSE "proforma_rate_limit"."count" + 1
                END,
                "windowStart" = CASE
                    WHEN "proforma_rate_limit"."windowStart" <= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}::int)
                    THEN (now() AT TIME ZONE 'UTC')
                    ELSE "proforma_rate_limit"."windowStart"
                END,
                "lastHit" = (now() AT TIME ZONE 'UTC')
            RETURNING "count"`;
        const count = rows[0]?.count;
        if (typeof count !== 'number') throw new Error('[rate-limit] upsert returned no count');
        try {
            await this.sweep();
        } catch (error) {
            // The hit above already counted; a failing sweep must not undo that by
            // throwing the store into fail-open.
            console.warn('[rate-limit] sweep failed', { message: error instanceof Error ? error.message : String(error) });
        }
        return count;
    }

    async lastHit(key: string): Promise<Date | null> {
        const rows = await this.db.$queryRaw<{ lastHit: Date }[]>`
            SELECT "lastHit" FROM "proforma_rate_limit" WHERE "key" = ${key}`;
        return rows[0]?.lastHit ?? null;
    }

    // Rows outside every window are dead weight. At most one DELETE per
    // process per interval, from inside hit(), so a quiet deployment never
    // sweeps and a busy one sweeps often enough.
    private async sweep(): Promise<void> {
        const now = this.now();
        if (now - this.lastSweep < SWEEP_INTERVAL_MS) return;
        this.lastSweep = now;
        await this.db.$executeRaw`
            DELETE FROM "proforma_rate_limit"
            WHERE "lastHit" < (now() AT TIME ZONE 'UTC') - make_interval(secs => ${RETENTION_SECONDS}::int)`;
    }
}

type MemoryEntry = { count: number; windowStart: number; lastHit: number };

/**
 * The same counters in a Map. PER INSTANCE: on serverless every instance has
 * its own, a cold start empties it, and nothing here is shared across a
 * deployment. It is what carries the limits while Postgres cannot, and what
 * the tests drive; it is not where the limits live.
 */
// Degraded mode only: bounded so a flood of distinct addresses cannot grow the
// map without limit while the primary store is down. Oldest entries go first.
const MEMORY_MAX_KEYS = 10_000;

export class MemoryRateLimitStore implements RateLimitStore {
    private readonly entries = new Map<string, MemoryEntry>();
    private lastSweep = 0;

    constructor(private readonly now: () => number = Date.now) {}

    async hit(key: string, windowSeconds: number): Promise<number> {
        const now = this.now();
        this.sweep(now);
        const entry = this.entries.get(key);
        if (!entry || entry.windowStart + windowSeconds * 1000 <= now) {
            if (this.entries.size >= MEMORY_MAX_KEYS) {
                const oldest = this.entries.keys().next().value;
                if (oldest !== undefined) this.entries.delete(oldest);
            }
            this.entries.set(key, { count: 1, windowStart: now, lastHit: now });
            return 1;
        }
        entry.count += 1;
        entry.lastHit = now;
        return entry.count;
    }

    async lastHit(key: string): Promise<Date | null> {
        const entry = this.entries.get(key);
        return entry ? new Date(entry.lastHit) : null;
    }

    private sweep(now: number): void {
        if (now - this.lastSweep < SWEEP_INTERVAL_MS) return;
        this.lastSweep = now;
        const cutoff = now - RETENTION_SECONDS * 1000;
        for (const [key, entry] of this.entries) {
            if (entry.lastHit < cutoff) this.entries.delete(key);
        }
    }
}

/**
 * The fail-open policy, as a store. Every call goes to the primary; the first
 * time the primary throws, the failure is reported (once per process, with
 * the cause, and naming the missing table when that is what it was) and the
 * fallback answers instead for the next minute, after which the primary is
 * tried again. A caller sees a count, never an error, and the request it is
 * deciding continues either way. ADR 0001 section 10, rule 2.
 *
 * The two stores do not share state: a minute on the fallback is a minute in
 * which the counters restart from empty on this instance. That is the
 * degradation the ADR chose over a lockout.
 */
export class FailOpenStore implements RateLimitStore {
    private degradedUntil = 0;
    // Once per distinct failure, and again after ten minutes of the same one.
    private reportedAt = new Map<string, number>();

    constructor(
        private readonly primary: RateLimitStore,
        private readonly fallback: RateLimitStore,
        private readonly now: () => number = Date.now,
    ) {}

    hit(key: string, windowSeconds: number): Promise<number> {
        return this.run((store) => store.hit(key, windowSeconds));
    }

    lastHit(key: string): Promise<Date | null> {
        return this.run((store) => store.lastHit(key));
    }

    private async run<T>(operation: (store: RateLimitStore) => Promise<T>): Promise<T> {
        if (this.now() < this.degradedUntil) return operation(this.fallback);
        try {
            return await operation(this.primary);
        } catch (error) {
            this.degradedUntil = this.now() + RETRY_PRIMARY_AFTER_MS;
            this.report(error);
            return operation(this.fallback);
        }
    }

    private report(error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        const last = this.reportedAt.get(message);
        if (last !== undefined && Date.now() - last < 10 * 60 * 1000) return;
        this.reportedAt.set(message, Date.now());
        const cause = isMissingTable(error)
            ? 'The proforma_rate_limit table does not exist: wattup-frontend applies the ' +
              '20260902200000_proforma_rate_limit migration, and this app never migrates.'
            : 'The Postgres store threw.';
        console.error(
            '[rate-limit] Postgres store unavailable; limits are being enforced in memory, ' +
                'per instance, until it answers again. Requests are NOT being refused for this ' +
                '(ADR 0001 section 10: the limiter fails open, identity fails closed). ' +
                cause,
            error,
        );
    }
}

/**
 * Prisma's shape for "relation does not exist", measured against this
 * database: P2021 from the typed client, and P2010 with a driver adapter cause
 * of kind TableDoesNotExist (SQLSTATE 42P01) from $queryRaw.
 */
export function isMissingTable(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    if (error.code === 'P2021') return true;
    if (error.code !== 'P2010') return false;
    const cause = (error.meta as { driverAdapterError?: { cause?: { kind?: unknown; originalCode?: unknown } } } | undefined)
        ?.driverAdapterError?.cause;
    return cause?.kind === 'TableDoesNotExist' || cause?.originalCode === '42P01';
}

let store: RateLimitStore | undefined;

/** The one store the routes use: Postgres, failing open to memory. Built once per process. */
export function getRateLimitStore(): RateLimitStore {
    return (store ??= new FailOpenStore(new PrismaRateLimitStore(), new MemoryRateLimitStore()));
}

/**
 * `kind:` + HMAC-SHA256 over the value, keyed with BETTER_AUTH_SECRET. The
 * secret is in REQUIRED_ENV (lib/env.ts), so both routes have already answered
 * 503 if it is missing; the throw here is for a caller that skipped that, and
 * the fail-open wrappers below turn it into a log line and `allowed`.
 */
export function rateLimitKey(kind: 'ip' | 'ip-verify' | 'email' | 'email-ip', value: string): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('[rate-limit] BETTER_AUTH_SECRET is not set; a counter cannot be keyed');
    return `${kind}:${createHmac('sha256', secret).update(value).digest('hex')}`;
}

/**
 * The per-IP hour counter. Hit BEFORE the directory lookup, for every request
 * with a parseable body, so probes for non-members count (see the header).
 * 'unknown' is a real key: with no client address at all, every such request
 * shares one bucket, which is a limit rather than none.
 */
export async function checkIpLimit(
    ip: string,
    kind: 'request' | 'verify' = 'request',
    store: RateLimitStore = getRateLimitStore(),
): Promise<RequestLimitResult> {
    try {
        const bucket = ipBucket(ip);
        const count = await store.hit(rateLimitKey(kind === 'verify' ? 'ip-verify' : 'ip', bucket), LIMITS.windowSeconds);
        const ceiling = kind === 'verify' ? LIMITS.ipVerifyPerWindow : LIMITS.ipPerWindow;
        return count > ceiling ? { allowed: false, reason: 'ip' } : { allowed: true };
    } catch (error) {
        return failOpen('checkIpLimit', error);
    }
}

/**
 * The per-address gap and hour counter, in that order. Hit AFTER the
 * directory lookup, for a current member only (see the header). A request
 * refused for the gap does not touch the hour counter.
 */
export async function checkEmailLimits(
    email: string,
    ip: string,
    store: RateLimitStore = getRateLimitStore(),
    now: () => number = Date.now,
): Promise<RequestLimitResult> {
    try {
        // Order matters and each step spends nothing if it refuses:
        //   1. gap, per address: the inbox is not sent to more than once a minute,
        //      whoever asked;
        //   2. per address AND source: one IP cannot exhaust a member's hour
        //      (security review: the old per-address-only counter let anyone who
        //      knew an address lock its owner out, silently, every hour);
        //   3. global per address: many sources still cannot flood one inbox.
        const addressKey = rateLimitKey('email', email);
        const last = await store.lastHit(addressKey);
        if (last && now() - last.getTime() < LIMITS.gapSeconds * 1000) {
            return { allowed: false, reason: 'gap' };
        }
        const perSource = await store.hit(rateLimitKey('email-ip', `${email}\n${ipBucket(ip)}`), LIMITS.windowSeconds);
        if (perSource > LIMITS.emailPerSourcePerWindow) return { allowed: false, reason: 'email' };
        const global = await store.hit(addressKey, LIMITS.windowSeconds);
        return global > LIMITS.emailGlobalPerWindow ? { allowed: false, reason: 'email-global' } : { allowed: true };
    } catch (error) {
        return failOpen('checkEmailLimits', error);
    }
}

// The last line of the fail-open policy. Nothing above should get here: the
// store wrapper already absorbs storage errors. Whatever did is a bug worth a
// line every time, and still not a reason to refuse anyone.
function failOpen(where: string, error: unknown): RequestLimitResult {
    console.error(`[rate-limit] ${where} threw; allowing the request (the limiter fails open)`, error);
    return { allowed: true };
}

/**
 * The client address as the platform reports it: the first x-forwarded-for
 * entry, then x-real-ip, else 'unknown'. The platform sets both on Vercel and
 * overwrites whatever the client sent, so what is trusted here is the proxy,
 * not the caller. In development there is no proxy and a caller can claim any
 * address; nothing but a per-IP counter turns on it.
 */
/**
 * The value a per-IP counter is keyed on. IPv4 as is. IPv6 by /64: a single
 * subscriber holds 2^64 addresses, so per-/128 buckets would make the IP limit a
 * formality (security review). Compressed forms are expanded first.
 */
export function ipBucket(ip: string): string {
    if (!ip.includes(':')) return ip;
    const [head, tail = ''] = ip.split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
    return groups.slice(0, 4).map((g) => g.toLowerCase().padStart(4, '0')).join(':') + '::/64';
}

export function clientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const real = headers.get('x-real-ip')?.trim();
    return real || 'unknown';
}
