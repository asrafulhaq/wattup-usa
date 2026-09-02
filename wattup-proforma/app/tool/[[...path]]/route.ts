import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { requireMember } from '@/lib/gate';

/**
 * Serves the Site Pro-Forma Builder from private/tool/, to signed-in users only.
 *
 * The tool's files live OUTSIDE public/ on purpose. A file in public/ has a URL
 * of its own, and one matcher mistake would hand model.js to the world. A file
 * under private/ has no URL at all: the only way to read it is through this
 * handler, and this handler checks the session before it touches the disk.
 * See ADR 0001 section 11.
 *
 * Every request goes through these checks, in this order:
 *
 *   1. canonical URL   /tool  -> 302 /tool/. No content is involved. index.html
 *                      loads css/app.css and js/*.js by RELATIVE path, which only
 *                      resolve under /tool/, so the document must live there.
 *   2. membership      requireMember (lib/gate.ts): a session read from the
 *                      database, not the cookie cache, for a user who is not
 *                      banned. Anything else -> 302 /login?next=<original path>
 *   3. path safety     '..', unexpected characters, a directory URL, or a
 *                      resolved path outside private/tool/  -> 404
 *   4. extension       not in CONTENT_TYPES -> 404
 *   5. read + respond  private, no-store, noindex, nosniff, never framed
 *
 * Production note: nothing imports these files, so the build's file tracing
 * cannot see them. next.config.ts lists them in outputFileTracingIncludes.
 * Without that entry this route works in dev and 404s on Vercel.
 */

// Reads the filesystem, so it can never run on the edge runtime.
export const runtime = 'nodejs';

const TOOL_ROOT = path.join(process.cwd(), 'private', 'tool');

// The complete list of what may be served. Anything else is a 404, whether or
// not the file exists: the vendored assets/brand/*.jpg are on disk because the
// copy is byte-for-byte, but nothing in the tool references them.
const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
};

// Gated content is never cached by a shared cache, never indexed, never
// sniffed into a different type than the one declared, and never framed by
// any origin. Both frame headers: frame-ancestors is what current browsers
// honour, X-Frame-Options is what everything else does. The tool's own
// preview iframe is unaffected, as it is written into about:blank and never
// navigates to a served URL.
const GATED_HEADERS = {
    'cache-control': 'private, no-store',
    'x-robots-tag': 'noindex, nofollow',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'content-security-policy': "frame-ancestors 'none'",
};

// A file name in the tool: letters, digits, dot, underscore, hyphen, and it may
// not start with a dot. Everything the tool ships fits this; nothing that could
// traverse or hide does.
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function isSafeSegment(segment: string): boolean {
    return !segment.includes('..') && SAFE_SEGMENT.test(segment);
}

/** Same-site absolute paths only, so the gate cannot be used as an open redirect. */
function safeNext(raw: string): string {
    // '//host' is protocol-relative, and browsers read '/\host' the same way.
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/tool/';
    return raw;
}

// Same shape as a genuinely absent route, so probing reveals nothing about
// which files exist.
const notFound = () => new Response('Not Found', { status: 404, headers: GATED_HEADERS });

const redirectTo = (location: string) =>
    new Response(null, { status: 302, headers: { ...GATED_HEADERS, location } });

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path?: string[] }> },
) {
    const { pathname, search } = request.nextUrl;
    const segments = (await params).path ?? [];

    // 1. Canonical URL. The framework's own trailing-slash redirect is switched
    //    off in next.config.ts, so this is the only place /tool is normalised.
    if (segments.length === 0 && !pathname.endsWith('/')) {
        return redirectTo('/tool/');
    }

    // 2. Membership, before anything is read from disk. requireMember is the
    //    only place that decides it: a database-backed session for a user who
    //    is not banned. Fail closed: an error is no membership, never membership.
    const member = await requireMember(await headers()).catch((error: unknown) => {
        console.error('[tool] membership check failed', error);
        return null;
    });
    if (!member) {
        return redirectTo(`/login?next=${encodeURIComponent(safeNext(pathname + search))}`);
    }

    // 3. Path safety. A directory URL (/tool/css/) is never a file, and every
    //    segment must be a plain file name. Next has already percent-decoded the
    //    segments, so an encoded '..' arrives here as '..'.
    if (segments.length > 0 && pathname.endsWith('/')) return notFound();
    if (!segments.every(isSafeSegment)) return notFound();

    const filePath = path.resolve(TOOL_ROOT, ...(segments.length ? segments : ['index.html']));
    if (!filePath.startsWith(TOOL_ROOT + path.sep)) return notFound();

    // 4. Only the extensions the tool is made of.
    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
    if (!contentType) return notFound();

    // 5. Read and respond. A missing file and a directory both throw, and both
    //    are a 404, with nothing about the cause in the body.
    const file = await readFile(filePath).catch(() => null);
    if (!file) return notFound();

    // Copied into a plain ArrayBuffer-backed view: a Node Buffer is typed over
    // ArrayBufferLike, which the Fetch BodyInit type does not accept.
    return new Response(new Uint8Array(file), {
        status: 200,
        headers: { ...GATED_HEADERS, 'content-type': contentType },
    });
}
