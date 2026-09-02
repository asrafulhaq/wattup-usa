import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from '@/app/tool/[[...path]]/route';

import { fakeSession, HOST, SITE } from '../helpers';
import { auth } from '../mocks/auth';
import { directory, member } from '../mocks/member-directory';
import { setRequestHeaders } from '../mocks/next-headers';
import { prisma } from '../mocks/prisma';

/**
 * GET /tool/[[...path]]. Checklist 5.12, ADR 0001 section 11.
 *
 * Two properties. Gating: without a current member's session the route serves
 * no bytes of the tool, whatever the path. Path safety: with one, it serves
 * only plain file names with the tool's own extensions from private/tool/,
 * and nothing else on the disk, whether or not the file exists.
 *
 * The files are real: process.cwd() is the app directory when the suite runs
 * (pnpm test from wattup-proforma/), and the 200 case compares the response
 * against the bytes on disk.
 */

const TOOL_ROOT = path.join(process.cwd(), 'private', 'tool');
const MEMBER = 'member@hostproposal.test';

function get(url: string, segments: string[] | undefined): Promise<Response> {
    return GET(new NextRequest(url), { params: Promise.resolve({ path: segments }) });
}

function signedIn(): void {
    setRequestHeaders({ host: HOST, cookie: 'wup.session_token=tok.sig' });
    auth.api.getSession.mockResolvedValue(fakeSession({ email: MEMBER }));
    prisma.user.findUnique.mockResolvedValue({ banned: false });
    directory.lookup.mockResolvedValue(member(MEMBER));
}

function signedOut(): void {
    setRequestHeaders({ host: HOST });
    auth.api.getSession.mockResolvedValue(null);
}

describe('gating: model.js', () => {
    it('signed out: 302 to /login?next=<the path>, and an EMPTY body', async () => {
        signedOut();

        const response = await get(`${SITE}/tool/js/model.js`, ['js', 'model.js']);

        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe('/login?next=%2Ftool%2Fjs%2Fmodel.js');
        expect(response.headers.get('content-type')).toBeNull();
        expect(await response.text()).toBe('');
        expect(response.headers.get('cache-control')).toBe('private, no-store');
    });

    it('signed out: the query string travels with the path, through safeNext', async () => {
        signedOut();

        const response = await get(`${SITE}/tool/?site=abc`, undefined);

        expect(response.headers.get('location')).toBe('/login?next=%2Ftool%2F%3Fsite%3Dabc');
    });

    it('a session for a banned user is signed out, not a member (checklist 5.13 at the route)', async () => {
        signedIn();
        prisma.user.findUnique.mockResolvedValue({ banned: true });

        const response = await get(`${SITE}/tool/js/model.js`, ['js', 'model.js']);

        expect(response.status).toBe(302);
        expect(await response.text()).toBe('');
    });

    it('a membership check that throws is no membership', async () => {
        signedIn();
        auth.api.getSession.mockRejectedValue(new Error('database gone'));

        const response = await get(`${SITE}/tool/js/model.js`, ['js', 'model.js']);

        expect(response.status).toBe(302);
        expect(await response.text()).toBe('');
    });

    it('signed in: 200, text/javascript, the file bytes, with the gated headers', async () => {
        signedIn();

        const response = await get(`${SITE}/tool/js/model.js`, ['js', 'model.js']);
        const expected = await readFile(path.join(TOOL_ROOT, 'js', 'model.js'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
        expect(Buffer.from(await response.arrayBuffer()).equals(expected)).toBe(true);
        expect(expected.length).toBeGreaterThan(0);
        expect(Object.fromEntries(response.headers)).toMatchObject({
            'cache-control': 'private, no-store',
            'x-robots-tag': 'noindex, nofollow',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'DENY',
            'content-security-policy': "frame-ancestors 'none'",
        });
        // The membership decision bypassed the cookie cache.
        expect(auth.api.getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }));
    });

    it('signed in: /tool/ is index.html', async () => {
        signedIn();

        const response = await get(`${SITE}/tool/`, undefined);
        const expected = await readFile(path.join(TOOL_ROOT, 'index.html'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(Buffer.from(await response.arrayBuffer()).equals(expected)).toBe(true);
    });

    it('/tool without the slash is 302 /tool/ before anything is checked', async () => {
        signedOut();

        const response = await get(`${SITE}/tool`, undefined);

        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe('/tool/');
        expect(auth.api.getSession).not.toHaveBeenCalled();
    });
});

describe('path safety: never a file that is not a plain name in private/tool/ with a listed extension', () => {
    // [label, url, segments as Next hands them over (already percent-decoded)]
    const attacks: [string, string, string[]][] = [
        ['..', `${SITE}/tool/../package.json`, ['..', 'package.json']],
        ['%2e%2e decoded by Next to ..', `${SITE}/tool/%2e%2e/package.json`, ['..', 'package.json']],
        ['%2e%2e left undecoded', `${SITE}/tool/%2e%2e/package.json`, ['%2e%2e', 'package.json']],
        ['.. deeper in', `${SITE}/tool/js/../../package.json`, ['js', '..', '..', 'package.json']],
        ['a backslash', `${SITE}/tool/js%5C..%5C..%5Cpackage.json`, ['js\\..\\..\\package.json']],
        ['a NUL byte', `${SITE}/tool/js/model.js%00`, ['js', 'model.js\u0000']],
        ['a . segment', `${SITE}/tool/./index.html`, ['.', 'index.html']],
        ['a dotfile', `${SITE}/tool/.env`, ['.env']],
        ['.env one level up', `${SITE}/tool/../.env`, ['..', '.env']],
        ['an unlisted extension that IS on disk (.jpg)', `${SITE}/tool/assets/brand/wattup-mark-light.jpg`, ['assets', 'brand', 'wattup-mark-light.jpg']],
        ['a directory with a trailing slash', `${SITE}/tool/css/`, ['css']],
        ['a directory without one', `${SITE}/tool/js`, ['js']],
        ['a listed extension that is not on disk', `${SITE}/tool/js/nope.js`, ['js', 'nope.js']],
    ];

    it.each(attacks)('signed in, %s: 404 Not Found', async (_label, url, segments) => {
        signedIn();

        const response = await get(url, segments);

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('Not Found');
        // Plain text, never a script, style, image or document type.
        expect(response.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
    });

    it.each(attacks)('signed out, %s: 302 with an empty body, never a file', async (_label, url, segments) => {
        signedOut();

        const response = await get(url, segments);

        expect(response.status).toBe(302);
        expect(response.headers.get('location')?.startsWith('/login?next=')).toBe(true);
        expect(await response.text()).toBe('');
    });

    it('every refusal is the same bytes, so probing reveals nothing about which files exist', async () => {
        signedIn();
        const missing = await get(`${SITE}/tool/js/nope.js`, ['js', 'nope.js']);
        const present = await get(`${SITE}/tool/assets/brand/wattup-mark-light.jpg`, ['assets', 'brand', 'wattup-mark-light.jpg']);
        const traversal = await get(`${SITE}/tool/../package.json`, ['..', 'package.json']);

        const shape = async (r: Response) => ({ status: r.status, body: await r.text(), headers: Object.fromEntries(r.headers) });
        const reference = await shape(missing);
        expect(await shape(present)).toEqual(reference);
        expect(await shape(traversal)).toEqual(reference);
    });
});
