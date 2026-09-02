/**
 * Same-site absolute paths only, so the gate cannot be used as an open
 * redirect. '//host' is protocol-relative, and browsers read '/\host' the same
 * way. Anything else, including nothing at all, is the tool's front door.
 * Checklist 2.23.
 *
 * A module of its own, with no imports, because this is the one definition
 * shared by three callers: the producer (app/tool, which builds ?next=), the
 * server consumer (verify-code, which reaches it through lib/gate.ts) and the
 * browser consumer (the login form, checklist 2.0b). lib/gate.ts imports
 * Prisma and cannot be bundled for the browser, so the definition lives here
 * and lib/gate.ts re-exports it.
 */
export function safeNext(raw: string | null | undefined): string {
    if (!raw) return '/tool/';
    // C0 controls and DEL. The WHATWG URL parser strips tabs and newlines before
    // parsing, so "/\t/evil.com" would pass a prefix check and resolve to
    // https://evil.com/. Anything in that range is refused outright.
    if (/[\u0000-\u001f\u007f]/.test(raw)) return '/tool/';
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/tool/';
    // Resolve against a throwaway origin and insist the result stayed on it: the
    // parser, not a prefix test, decides what the browser will do with the value.
    let resolved: URL;
    try {
        resolved = new URL(raw, 'http://safe-next.invalid');
    } catch {
        return '/tool/';
    }
    if (resolved.origin !== 'http://safe-next.invalid') return '/tool/';
    return resolved.pathname + resolved.search;
}
