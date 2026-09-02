import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeSession, HOST, SITE } from '../helpers';
import { auth } from '../mocks/auth';
import { directory, member } from '../mocks/member-directory';
import { setRequestHeaders } from '../mocks/next-headers';
import { runAfterCallbacks, scheduledAfterCount } from '../mocks/next-server';
import { prisma } from '../mocks/prisma';

/**
 * POST /api/tool/evpin-fetch. Checklist 5.15.
 *
 * The route exists so a landlord's confidential report URL stops passing through
 * r.jina.ai and api.allorigins.win. It takes a URL from a browser and fetches it from
 * inside WattUp's infrastructure, which is the shape of a server-side request forgery,
 * so the guards ARE the route and these tests are mostly refusals.
 *
 * No test makes a real outbound request: global fetch is replaced, and so is DNS.
 */

const MEMBER = 'member@hostproposal.test';
const ENDPOINT = `${SITE}/api/tool/evpin-fetch`;
const REPORT = 'https://evpin.com/report/abc123';

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: lookupMock }));

let POST: typeof import('@/app/api/tool/evpin-fetch/route').POST;
let fetchMock: ReturnType<typeof vi.fn>;

function signedIn(): void {
    setRequestHeaders({ host: HOST, cookie: 'wup.session_token=tok.sig' });
    auth.api.getSession.mockResolvedValue(fakeSession({ email: MEMBER }));
    prisma.user.findUnique.mockResolvedValue({ banned: false });
    directory.lookup.mockResolvedValue(member(MEMBER));
}

function post(body: unknown, init: { origin?: string | null; contentType?: string | null } = {}): Promise<Response> {
    const headers = new Headers({ host: HOST });
    const origin = init.origin === undefined ? SITE : init.origin;
    if (origin !== null) headers.set('origin', origin);
    const contentType = init.contentType === undefined ? 'application/json' : init.contentType;
    if (contentType !== null) headers.set('content-type', contentType);
    return POST(new Request(ENDPOINT, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }));
}

/** An upstream that answers 200 with `text`, as a real report host would. */
function upstreamOk(text = 'x'.repeat(500)): void {
    fetchMock.mockResolvedValue(
        new Response(text, { status: 200, headers: { 'content-type': 'text/html' } })
    );
}

beforeEach(async () => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // A genuinely globally routable address. The documentation ranges are NOT usable
    // here: 192.0.2/24, 198.51.100/24 and 203.0.113/24 are TEST-NET-1 to 3 and the route
    // refuses them all, correctly.
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    signedIn();
    POST ??= (await import('@/app/api/tool/evpin-fetch/route')).POST;
});

describe('who may call it', () => {
    it('refuses a cross-origin caller with 403, before any session is read', async () => {
        const response = await post({ url: REPORT }, { origin: 'https://evil.test' });

        expect(response.status).toBe(403);
        expect(auth.api.getSession).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses a signed-out caller with 403 and fetches nothing', async () => {
        setRequestHeaders({ host: HOST });
        auth.api.getSession.mockResolvedValue(null);

        const response = await post({ url: REPORT });

        expect(response.status).toBe(403);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses someone the directory no longer lists, with the same 403', async () => {
        directory.lookup.mockResolvedValue(null);

        const response = await post({ url: REPORT });

        expect(response.status).toBe(403);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('the body', () => {
    it.each([
        ['a form content type, which is all a cross-site post can declare', { contentType: 'text/plain' }],
        ['no content type at all', { contentType: null }],
    ])('refuses %s', async (_why, init) => {
        const response = await post({ url: REPORT }, init);

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ['not JSON', 'not json at all'],
        ['a JSON array', JSON.stringify([REPORT])],
        ['an object with no url', JSON.stringify({ notUrl: REPORT })],
        ['a url that is not a string', JSON.stringify({ url: 42 })],
        ['a url that does not parse', JSON.stringify({ url: 'http://' })],
    ])('refuses %s with 400', async (_why, body) => {
        const response = await post(body);

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('the URL guards', () => {
    it.each([
        ['http', 'http://evpin.com/report/a'],
        ['file', 'file:///etc/passwd'],
        ['data', 'data:text/plain,hello'],
        ['ftp', 'ftp://evpin.com/report/a'],
        ['credentials in the URL, which fetch would send as Authorization', 'https://user:pass@evpin.com/report/a'],
        ['an explicit port', 'https://evpin.com:8443/report/a'],
    ])('refuses %s', async (_why, url) => {
        const response = await post({ url });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ['a different host entirely', 'https://example.test/report/a'],
        ['a host that merely CONTAINS the allowed one', 'https://evpin.com.attacker.test/report/a'],
        ['a host the allowed one is a suffix of', 'https://notevpin.com/report/a'],
        ['the cloud metadata service by name', 'https://metadata.google.internal/computeMetadata/v1/'],
    ])('refuses %s, so the allowlist is a match and not a substring', async (_why, url) => {
        const response = await post({ url });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('accepts a subdomain of an allowed host', async () => {
        upstreamOk();

        const response = await post({ url: 'https://reports.evpin.com/report/a' });

        expect(response.status).toBe(200);
    });
});

describe('where the name actually points', () => {
    it.each([
        ['loopback', '127.0.0.1'],
        ['the cloud metadata address', '169.254.169.254'],
        ['a private 10/8 address', '10.0.0.5'],
        ['a private 192.168 address', '192.168.1.1'],
        ['a CGNAT address', '100.64.0.1'],
        ['IPv6 loopback', '::1'],
        ['an IPv4-mapped loopback, the spelling that slips past a naive check', '::ffff:127.0.0.1'],
        ['a unique-local IPv6 address', 'fd00::1'],
        ['a link-local IPv6 address', 'fe80::1'],
    ])('refuses a host that resolves to %s', async (_why, address) => {
        lookupMock.mockResolvedValue([{ address, family: address.includes(':') ? 6 : 4 }]);

        const response = await post({ url: REPORT });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses when ANY of several answers is private, not just the first', async () => {
        lookupMock.mockResolvedValue([
            { address: '93.184.216.34', family: 4 },
            { address: '127.0.0.1', family: 4 },
        ]);

        const response = await post({ url: REPORT });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses a host that resolves to nothing', async () => {
        lookupMock.mockResolvedValue([]);

        const response = await post({ url: REPORT });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('the outbound request', () => {
    it('sends no cookie, no authorization and no referrer, and does not follow redirects', async () => {
        upstreamOk();

        await post({ url: REPORT });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0]!;
        expect(String(url)).toBe(REPORT);
        expect(init).toMatchObject({
            method: 'GET',
            redirect: 'manual',
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
        });
        const sent = new Headers(init.headers as HeadersInit);
        expect(sent.get('cookie')).toBeNull();
        expect(sent.get('authorization')).toBeNull();
        expect(sent.get('referer')).toBeNull();
    });

    it.each([301, 302, 307, 308])('treats a %s as a refusal, since a redirect leaves the allowlist', async (status) => {
        fetchMock.mockResolvedValue(new Response(null, { status, headers: { location: 'https://evil.test/' } }));

        const response = await post({ url: REPORT });

        expect(response.status).toBe(502);
    });

    it('refuses an upstream error status', async () => {
        fetchMock.mockResolvedValue(new Response('nope', { status: 404 }));

        expect((await post({ url: REPORT })).status).toBe(502);
    });

    it('refuses a declared content-length over the ceiling without reading the body', async () => {
        fetchMock.mockResolvedValue(
            new Response('x', { status: 200, headers: { 'content-length': String(3 * 1024 * 1024) } })
        );

        expect((await post({ url: REPORT })).status).toBe(502);
    });

    it('refuses a body that exceeds the ceiling while streaming, whatever it claimed', async () => {
        const chunk = new Uint8Array(256 * 1024);
        let sent = 0;
        fetchMock.mockResolvedValue(
            new Response(
                new ReadableStream<Uint8Array>({
                    pull(controller) {
                        // 12 x 256 KB is over the 2 MB ceiling, and content-length says nothing.
                        if (sent++ >= 12) return controller.close();
                        controller.enqueue(chunk);
                    },
                }),
                { status: 200 }
            )
        );

        expect((await post({ url: REPORT })).status).toBe(502);
    });

    it('refuses when the upstream is unreachable', async () => {
        fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

        expect((await post({ url: REPORT })).status).toBe(502);
    });
});

describe('the answer, and the audit row', () => {
    it('returns the report text and the host, and forwards nothing of the upstream response', async () => {
        fetchMock.mockResolvedValue(
            new Response('y'.repeat(400), {
                status: 200,
                headers: { 'set-cookie': 'upstream=1', 'x-upstream-secret': 'leaked' },
            })
        );

        const response = await post({ url: REPORT });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ text: 'y'.repeat(400), via: 'evpin.com' });
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(response.headers.get('x-upstream-secret')).toBeNull();
    });

    it('writes the audit row only after the response, never on the response path', async () => {
        upstreamOk();

        const response = await post({ url: REPORT });

        // The response exists and nothing has been written yet: the same property
        // request-code and verify-code hold.
        expect(response.status).toBe(200);
        expect(prisma.activityLog.create).not.toHaveBeenCalled();
        expect(scheduledAfterCount()).toBeGreaterThan(0);

        await runAfterCallbacks();

        expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
        expect(prisma.activityLog.create.mock.calls[0]![0]!.data).toMatchObject({
            app: 'proforma',
            event: 'tool.evpin_fetch',
            email: MEMBER,
            meta: { host: 'evpin.com', ok: true },
        });
    });

    it('records a refusal too, with ok false', async () => {
        fetchMock.mockResolvedValue(new Response('nope', { status: 404 }));

        await post({ url: REPORT });
        await runAfterCallbacks();

        expect(prisma.activityLog.create.mock.calls[0]![0]!.data).toMatchObject({
            event: 'tool.evpin_fetch',
            meta: { host: 'evpin.com', ok: false },
        });
    });

    it('writes nothing for a URL with no host to attribute it to', async () => {
        await post({ url: 'data:text/plain,hello' });
        await runAfterCallbacks();

        expect(prisma.activityLog.create).not.toHaveBeenCalled();
    });
});
