import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';

/**
 * Rate limiter for the public contact forms (finding F7, checklist B.6).
 *
 * Five submissions per client address per ten minutes, counted in a Map in
 * this process. It is deliberately the smallest thing that stops a script
 * from turning the contact form into a Resend bill and an inbox flood: no
 * dependency, no table, no migration.
 *
 * PER INSTANCE, NOT A GUARANTEE. On serverless every instance has its own
 * Map, a cold start empties it, and nothing here is shared across a
 * deployment: two instances are two independent counters, so the real
 * ceiling is five per instance per window, not five. It is a nuisance
 * control that raises the cost of abuse, with the same caveat the pro-forma
 * app documents for its memory store (wattup-proforma/lib/rate-limit.ts,
 * MemoryRateLimitStore). A limit that has to hold moves to the shared store
 * that B.10 tracks.
 *
 * KEYS. Every counter is keyed on HMAC-SHA256(BETTER_AUTH_SECRET, address),
 * hex, never the raw address, so the Map holds nothing that identifies
 * anyone and rotating the secret orphans every entry. The address is what the
 * platform reports: the first x-forwarded-for entry, then x-real-ip, else
 * 'unknown'. On Vercel the platform sets both and overwrites whatever the
 * client sent, so what is trusted is the proxy, not the caller; in
 * development there is no proxy. With no address at all every such request
 * shares the one 'unknown' bucket, which is a limit rather than none. IPv6 is
 * bucketed by /64 before hashing, as the pro-forma limiter does after its
 * security review: one subscriber holds 2^64 addresses, so a per-address
 * limit would be a formality.
 *
 * BOUNDED. At most 500 keys. A new key past that evicts the entry with the
 * oldest window, so a flood of distinct addresses costs at most 500 small
 * objects, and the entries it pushes out are the ones closest to expiry.
 *
 * FAILS OPEN. checkContactRateLimit never throws: if the secret is missing or
 * headers() is unavailable, the failure is logged and the submission
 * continues, the same policy the pro-forma limiter follows (ADR 0001 section
 * 10). A limiter that fails closed turns its own outage into a dead contact
 * form, which costs more than the spam it exists to slow.
 *
 * This module runs only from 'use server' modules. It is not marked
 * 'server-only' so a plain script can drive hitContactRateLimit directly;
 * next/headers itself refuses to bundle for the client.
 */

export const CONTACT_LIMITS = {
    /** Submissions per client address per window. */
    perWindow: 5,
    /** The fixed window, in milliseconds. */
    windowMs: 10 * 60 * 1000,
    /** Distinct keys held at once; oldest window evicted first past this. */
    maxKeys: 500,
} as const;

/** The neutral refusal shown to the caller. Says nothing about the limit. */
export const CONTACT_RATE_LIMITED_MESSAGE = 'Too many requests. Please try again in a few minutes.';

type Entry = { count: number; windowStart: number };

// Insertion order is window order: an entry is deleted and re-inserted when
// its window resets, so the first key in the Map always has the oldest
// windowStart and eviction is a single delete of that key.
const entries = new Map<string, Entry>();

/**
 * Count one hit for `key` in the fixed window that contains `now`, and say
 * whether it stays within the limit. Synchronous, so two concurrent actions
 * on one instance cannot interleave between the read and the write.
 */
export function hitContactRateLimit(key: string, now: number = Date.now()): boolean {
    const entry = entries.get(key);
    if (entry && now - entry.windowStart < CONTACT_LIMITS.windowMs) {
        entry.count += 1;
        return entry.count <= CONTACT_LIMITS.perWindow;
    }
    // A new key, or an expired window: start a fresh window at the back of the
    // Map, making room first if the cap is reached.
    if (entry) entries.delete(key);
    if (entries.size >= CONTACT_LIMITS.maxKeys) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
    }
    entries.set(key, { count: 1, windowStart: now });
    return true;
}

/** How many keys are held right now. For tests and diagnostics. */
export function contactRateLimitSize(): number {
    return entries.size;
}

/**
 * HMAC-SHA256 over the address bucket, keyed with BETTER_AUTH_SECRET, hex.
 * Throws when the secret is missing; checkContactRateLimit turns that into a
 * log line and `allowed`.
 */
export function contactRateLimitKey(address: string): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('[contact-rate-limit] BETTER_AUTH_SECRET is not set; a counter cannot be keyed');
    return createHmac('sha256', secret).update(ipBucket(address)).digest('hex');
}

/**
 * The client address as the platform reports it: the first x-forwarded-for
 * entry, then x-real-ip, else 'unknown'. Copied from
 * wattup-proforma/lib/rate-limit.ts (clientIp); the two apps share no code.
 */
export function clientAddress(h: Headers): string {
    const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const real = h.get('x-real-ip')?.trim();
    return real || 'unknown';
}

/**
 * The value a per-address counter is keyed on. IPv4 as is. IPv6 by /64, with
 * compressed forms expanded first. Copied from
 * wattup-proforma/lib/rate-limit.ts (ipBucket); the two apps share no code.
 */
export function ipBucket(ip: string): string {
    if (!ip.includes(':')) return ip;
    const [head, tail = ''] = ip.split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
    return groups.slice(0, 4).map((g) => g.toLowerCase().padStart(4, '0')).join(':') + '::/64';
}

/**
 * The check the contact actions call, once per submission, before any work.
 * Reads the caller's address from the request headers, hits its counter, and
 * says whether the submission may proceed. Never throws (see FAILS OPEN).
 */
export async function checkContactRateLimit(): Promise<boolean> {
    try {
        const key = contactRateLimitKey(clientAddress(await headers()));
        return hitContactRateLimit(key);
    } catch (error) {
        console.error('[contact-rate-limit] check threw; allowing the submission (the limiter fails open)', error);
        return true;
    }
}
