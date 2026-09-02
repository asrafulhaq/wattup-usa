import { lookup } from 'node:dns/promises';

import { after } from 'next/server';

import { activityContext, logActivity } from '@/lib/activity-log';
import { correlationId, describeError, describeOrigin, forbidden, GATE_RESPONSE_HEADERS, isSameOrigin, requireMember } from '@/lib/gate';
import { normalizeEmail } from '@/lib/member-directory';

/**
 * POST /api/tool/evpin-fetch        body: { url }        answer: { text, via }
 *
 * The first-party reader for the tool's EVpin import. Checklist 5.15.
 *
 * WHY THIS EXISTS. `private/tool/js/evpin.js` used to fetch a pasted report URL
 * through r.jina.ai and api.allorigins.win, two unaffiliated services, so a
 * landlord's confidential site-report URL and its whole contents passed through
 * companies WattUp has no agreement with. The PRD flagged the choice and left
 * it open; this route is the answer, and repointing EVPIN_READERS at it is the
 * ONE edit ever made to private/tool/ (ADR 0001 section 11, the tool-freeze
 * exception, and AGENTS.md).
 *
 * WHAT IT IS. A deliberately narrow outbound fetcher, and nothing else. It
 * takes a URL from a browser, which makes that URL untrusted, and it fetches it
 * from inside WattUp's infrastructure, which is exactly the shape of a
 * server-side request forgery. So the guards below are the route, and the fetch
 * is the afterthought. They run in this order, each a refusal on its own:
 *
 *    1. origin        lib/gate.ts isSameOrigin: the request's Origin, else its
 *                     Referer, must name this host -> 403 (checklist 5.8).
 *    2. membership    lib/gate.ts requireMember, the same call app/tool makes:
 *                     a session read past the cookie cache, a user who is not
 *                     banned, a current directory member. A throw is no
 *                     membership, never membership -> 403. Signed out and
 *                     non-member are the same 403 as cross-origin, so this
 *                     route says nothing app/tool has not already said.
 *    3. content type  application/json required, so a cross-site form post,
 *                     which can only declare text/plain, is malformed by
 *                     definition -> 400.
 *    4. body          a JSON object with a string `url` -> 400.
 *    5. parse         `new URL` -> 400.
 *    6. scheme        https: and nothing else. http:, file:, data:, blob:,
 *                     gopher:, ftp: are all refused by that one comparison.
 *    7. userinfo      no `user:pass@host`. fetch would turn it into an
 *                     Authorization header, and this route sends none -> 400.
 *    8. port          the https default only. A real report URL has no port,
 *                     and an explicit one widens the reachable surface for no
 *                     gain -> 400.
 *    9. host          EVPIN_ALLOWED_HOSTS below: equality or a dot-suffix,
 *                     never `includes` -> 400. THE PRIMARY CONTROL.
 *   10. address       every address the hostname resolves to must be public.
 *                     See isPrivateAddress -> 400.
 *   11. fetch         redirect: 'manual', credentials: 'omit', no Cookie, no
 *                     Authorization, no Referer, a 10 s AbortSignal.timeout.
 *                     A throw or a timeout -> 502.
 *   12. redirect      a 3xx is a refusal, not something to follow: a redirect
 *                     is how a permitted host hands the fetch to one that is
 *                     not -> 502.
 *   13. status        any other non-2xx -> 502.
 *   14. content-length  over MAX_RESPONSE_BYTES -> 502.
 *   15. stream        read with a hard byte ceiling, so a chunked or lying
 *                     response cannot exceed it either -> 502.
 *   16. answer        { text, via } as JSON. None of the upstream's headers,
 *                     cookies or status reach the caller.
 *
 * The audit row (tool.evpin_fetch, lib/activity-log.ts) is written from inside
 * after(), like every other row this app writes: never on the response path,
 * where its latency and its failure would both be observable.
 */

// dns.lookup and the byte-level stream read: never the edge runtime.
export const runtime = 'nodejs';
// One upstream fetch plus a DNS resolution, on a platform whose default may be
// shorter than the 10 s the fetch itself is allowed.
export const maxDuration = 30;

/**
 * The hostnames a report URL may name. `evpin.com` and its subdomains is the
 * base case, derived from what the tool itself says a report URL looks like:
 * the placeholder in private/tool/js/app.js is `https://evpin.com/report/…`,
 * and neither private/tool/js/evpin.js nor the PRD (docs/Pro-Forma Access.md)
 * names any other host.
 *
 * EVPIN_ALLOWED_HOSTS extends it, comma separated, so a hostname change at
 * EVpin needs an environment edit rather than a code deploy. It is read on
 * every request and is NOT in lib/env.ts's required list: that list is a
 * fail-closed 503, and this variable is an optional extension whose absence is
 * the normal case.
 */
export const EVPIN_ALLOWED_HOSTS = ['evpin.com'] as const;

/** Bigger than any site report, small enough that a hostile response cannot exhaust the function. */
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Long enough for a slow report page, short enough that a stalling host is not a held connection. */
const UPSTREAM_TIMEOUT_MS = 10_000;

// Serialised once, so every refusal of a kind returns these exact bytes. The
// caller learns the class of the refusal from the status and nothing more; the
// reason is on the log line, findable by the correlation id.
const REFUSED_BODY = JSON.stringify({ message: 'Refused' });

/**
 * 400: nothing about the submitted URL made it a public EVpin report.
 * 502: the URL was acceptable and the upstream could not be read.
 * Those are the only two, so a caller cannot map a status onto which guard
 * fired beyond that distinction.
 */
function refused(id: string, status: 400 | 502): Response {
    return new Response(REFUSED_BODY, {
        status,
        headers: {
            ...GATE_RESPONSE_HEADERS,
            'content-type': 'application/json; charset=utf-8',
            'x-correlation-id': id,
        },
    });
}

function answer(id: string, text: string, via: string): Response {
    return new Response(JSON.stringify({ text, via }), {
        status: 200,
        headers: {
            ...GATE_RESPONSE_HEADERS,
            'content-type': 'application/json; charset=utf-8',
            'x-correlation-id': id,
        },
    });
}

/** The base list plus EVPIN_ALLOWED_HOSTS, lowercased, blanks dropped. */
export function allowedHosts(): string[] {
    const extra = (process.env.EVPIN_ALLOWED_HOSTS ?? '')
        .split(',')
        .map((host) => host.trim().toLowerCase().replace(/\.$/, ''))
        .filter((host) => host !== '');
    return [...EVPIN_ALLOWED_HOSTS, ...extra];
}

/**
 * Whether a hostname is one of the allowed hosts, or a subdomain of one.
 * Equality or a dot-suffix, never `includes`: `evpin.com.attacker.test`
 * contains "evpin.com" and must not pass, and neither must `notevpin.com`.
 */
export function isAllowedHost(hostname: string, allowed: string[] = allowedHosts()): boolean {
    const host = hostname.trim().toLowerCase().replace(/\.$/, '');
    if (host === '') return false;
    return allowed.some((base) => host === base || host.endsWith(`.${base}`));
}

/** The four octets of a dotted-quad, or null if it is not one. */
function ipv4Parts(address: string): [number, number, number, number] | null {
    const parts = address.split('.');
    if (parts.length !== 4) return null;
    const out: number[] = [];
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part)) return null;
        const octet = Number(part);
        if (octet > 255) return null;
        out.push(octet);
    }
    return out as [number, number, number, number];
}

/**
 * Everything that is not a globally routable IPv4 address. Unparseable counts
 * as private: an address this code cannot read is one it cannot vouch for.
 */
function isPrivateIpv4(address: string): boolean {
    const parts = ipv4Parts(address);
    if (parts === null) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8, "this network", and 0.0.0.0 itself
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT
    if (a === 169 && b === 254) return true; // 169.254/16 link-local, the cloud metadata address
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 private
    if (a === 192 && b === 0) return true; // 192.0.0/24 IETF, 192.0.2/24 TEST-NET-1
    if (a === 192 && b === 168) return true; // private
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 benchmarking
    if (a === 198 && b === 51) return true; // 198.51.100/24 TEST-NET-2
    if (a === 203 && b === 0) return true; // 203.0.113/24 TEST-NET-3
    if (a >= 224) return true; // 224/4 multicast, 240/4 reserved, 255.255.255.255
    return false;
}

/**
 * The eight 16-bit groups of an IPv6 literal, or null if it does not parse.
 * A zone id is dropped and a trailing dotted quad (`::ffff:127.0.0.1`) is
 * folded into the low two groups, so the mapped and the hex spelling of the
 * same address (`::ffff:7f00:1`) come out identical.
 */
function ipv6Groups(address: string): number[] | null {
    let text = (address.split('%')[0] ?? '').toLowerCase();
    if (text === '') return null;

    const dotted = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
    if (dotted !== null) {
        const quad = ipv4Parts(dotted[2]!);
        if (quad === null) return null;
        text = `${dotted[1]!}${((quad[0] << 8) | quad[1]).toString(16)}:${((quad[2] << 8) | quad[3]).toString(16)}`;
    }

    const halves = text.split('::');
    if (halves.length > 2) return null;

    const parse = (part: string): number[] | null => {
        if (part === '') return [];
        const out: number[] = [];
        for (const group of part.split(':')) {
            if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
            out.push(parseInt(group, 16));
        }
        return out;
    };

    const head = parse(halves[0]!);
    const tail = halves.length === 2 ? parse(halves[1]!) : [];
    if (head === null || tail === null) return null;
    if (halves.length === 1) return head.length === 8 ? head : null;
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    return [...head, ...new Array<number>(fill).fill(0), ...tail];
}

/**
 * Everything that is not a globally routable IPv6 address. The IPv4-mapped and
 * IPv4-compatible forms are judged by the address they embed, so
 * `::ffff:127.0.0.1` is loopback rather than "some v6 host"; the named blocks
 * are then spelled out for the record, and the last line refuses everything
 * outside 2000::/3, the only range IANA has assigned for global unicast.
 */
function isPrivateIpv6(address: string): boolean {
    const groups = ipv6Groups(address);
    if (groups === null) return true;

    const topFiveZero = groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0;
    if (topFiveZero && (groups[5] === 0xffff || groups[5] === 0)) {
        const low = groups[6]!;
        const high = groups[7]!;
        return isPrivateIpv4(`${low >> 8}.${low & 0xff}.${high >> 8}.${high & 0xff}`);
    }

    if (groups[0] === 0) return true; // ::1, ::, and the rest of 0::/16
    if ((groups[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
    if ((groups[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((groups[0]! & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (groups[0] === 0x0064 && groups[1] === 0xff9b) return true; // 64:ff9b::/96 NAT64
    return (groups[0]! & 0xe000) !== 0x2000; // outside 2000::/3 global unicast
}

/** Either family, by the form of the address rather than by what the resolver claimed. */
export function isPrivateAddress(address: string): boolean {
    return address.includes(':') ? isPrivateIpv6(address) : isPrivateIpv4(address);
}

/**
 * Whether every address the hostname resolves to is public. `all: true` so a
 * hostname with one public and one private answer is refused on the private
 * one; a hostname that resolves to nothing is refused too.
 *
 * THIS NARROWS DNS REBINDING, IT DOES NOT ELIMINATE IT. The name is resolved
 * here and resolved again by fetch(), and a hostile authoritative server with
 * a zero TTL can answer differently the second time. Closing that needs a
 * fetch bound to the address checked here, which undici does not expose. The
 * HOST ALLOWLIST is the primary control: an attacker has to own a name under
 * evpin.com before this matters at all. This check is the second lock.
 */
async function resolvesPublic(hostname: string): Promise<{ ok: true } | { ok: false; address: string }> {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0) return { ok: false, address: 'none' };
    for (const { address } of addresses) {
        if (isPrivateAddress(address)) return { ok: false, address };
    }
    return { ok: true };
}

/**
 * The body as text, or null when it went over the ceiling. Read chunk by chunk
 * and counted: content-length is a claim, and a chunked response makes none at
 * all, so the ceiling has to hold on the bytes that actually arrive.
 */
async function readCapped(body: ReadableStream<Uint8Array> | null, limit: number): Promise<{ text: string; bytes: number } | null> {
    if (body === null) return { text: '', bytes: 0 };
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value === undefined) continue;
            bytes += value.byteLength;
            if (bytes > limit) return null;
            chunks.push(value);
        }
    } finally {
        // Releases the socket whether the read finished or was abandoned.
        await reader.cancel().catch(() => undefined);
    }
    const joined = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
        joined.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return { text: new TextDecoder('utf-8').decode(joined), bytes };
}

/** The URL, or null for anything that is not a JSON object with a string url. */
async function readUrl(request: Request): Promise<string | null> {
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return null;
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null) return null;
    const { url } = body as { url?: unknown };
    return typeof url === 'string' ? url : null;
}

export async function POST(request: Request) {
    const id = correlationId();

    // 1. Origin, before a session is read: an off-site caller never costs a
    //    database round trip.
    if (!isSameOrigin(request.headers)) {
        console.warn('[tool] evpin-fetch refused', { id, reason: 'CROSS_ORIGIN', ...describeOrigin(request.headers) });
        return forbidden(id);
    }

    // 2. Membership. The same call app/tool/[[...path]] makes, and the same
    //    fail-closed treatment of a throw. request.headers rather than Next's
    //    headers(): the cookie this route needs is on the request it was
    //    handed, and nothing here issues a new one mid-flight.
    const member = await requireMember(request.headers).catch((error: unknown) => {
        console.error('[tool] evpin-fetch: membership check failed', { id, ...describeError(error) });
        return null;
    });
    if (!member) {
        console.warn('[tool] evpin-fetch refused', { id, reason: 'NOT_A_MEMBER' });
        return forbidden(id);
    }

    const email = normalizeEmail(member.user.email);
    const userId = member.user.id;
    const context = activityContext(request.headers, id);

    // 3 and 4. The body.
    const submitted = await readUrl(request);
    if (submitted === null) {
        console.warn('[tool] evpin-fetch refused', { id, reason: 'BAD_BODY' });
        return refused(id, 400);
    }

    // 5. Parse. Nothing about the URL is logged before this point, because
    //    there is no host to log and the path is the sensitive part.
    let url: URL;
    try {
        url = new URL(submitted);
    } catch {
        console.warn('[tool] evpin-fetch refused', { id, reason: 'UNPARSEABLE' });
        return refused(id, 400);
    }

    const host = url.host;
    // Every line below this point may name the host. The path and the query
    // never appear in a log: a report URL identifies the site and the deal.
    const audit = (ok: boolean, bytes: number) =>
        after(() => logActivity({ ...context, event: 'tool.evpin_fetch', email, userId, meta: { host, ok, bytes } }));
    const deny = (reason: string, status: 400 | 502, detail: Record<string, string> = {}) => {
        console.warn('[tool] evpin-fetch refused', { id, reason, host, ...detail });
        // A URL with no host (file:, data:) has no host to attribute a row to,
        // the way request-code writes nothing for a body it could not read.
        if (host !== '') audit(false, 0);
        return refused(id, status);
    };

    // 6. Scheme.
    if (url.protocol !== 'https:') return deny('BAD_SCHEME', 400, { scheme: url.protocol });

    // 7. Credentials in the URL, which fetch would send as Authorization.
    if (url.username !== '' || url.password !== '') return deny('URL_CREDENTIALS', 400);

    // 8. The https default port only.
    if (url.port !== '') return deny('EXPLICIT_PORT', 400);

    // 9. The allowlist. The primary control.
    if (!isAllowedHost(url.hostname)) return deny('HOST_NOT_ALLOWED', 400);

    // 10. Where the name actually points.
    const resolved = await resolvesPublic(url.hostname).catch((error: unknown) => {
        console.warn('[tool] evpin-fetch: DNS lookup failed', { id, host, ...describeError(error) });
        return { ok: false as const, address: 'unresolved' };
    });
    if (!resolved.ok) return deny('PRIVATE_ADDRESS', 400, { address: resolved.address });

    // 11. The one outbound request. Nothing of the caller travels with it: no
    //     cookies, no Authorization, no Referer, and no header this route was
    //     given. Only the URL, which the guards above have vouched for.
    let upstream: Response;
    try {
        upstream = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
            headers: { accept: 'text/plain, text/html, */*' },
        });
    } catch (error) {
        return deny('UPSTREAM_UNREACHABLE', 502, { error: describeError(error).name });
    }

    // 12. A redirect is a way out of the allowlist, so it is a refusal rather
    //     than a hop. Both spellings: undici returns the 3xx itself, the Fetch
    //     standard's opaqueredirect is what a browser-shaped implementation
    //     would give.
    if ((upstream.status >= 300 && upstream.status < 400) || upstream.type === 'opaqueredirect') {
        return deny('UPSTREAM_REDIRECT', 502, { status: String(upstream.status) });
    }

    // 13. Anything else that is not a success.
    if (!upstream.ok) return deny('UPSTREAM_STATUS', 502, { status: String(upstream.status) });

    // 14. The claim, when the upstream makes one.
    const declared = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
        return deny('UPSTREAM_TOO_LARGE', 502, { contentLength: String(declared) });
    }

    // 15. The bytes, whatever it claimed.
    const read = await readCapped(upstream.body, MAX_RESPONSE_BYTES).catch((error: unknown) => {
        console.warn('[tool] evpin-fetch: read failed', { id, host, ...describeError(error) });
        return null;
    });
    if (read === null) return deny('UPSTREAM_TOO_LARGE', 502, { limit: String(MAX_RESPONSE_BYTES) });

    // 16. The answer. Built here, from the text and the host: not one header,
    //     cookie or status of the upstream's is forwarded.
    console.info('[tool] evpin-fetch: report read', { id, host, bytes: read.bytes });
    audit(true, read.bytes);
    return answer(id, read.text, host);
}
