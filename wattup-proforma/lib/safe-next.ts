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
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
        return '/tool/';
    }
    return raw;
}
