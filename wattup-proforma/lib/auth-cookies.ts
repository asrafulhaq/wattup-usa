/**
 * How this app's auth cookies are named.
 *
 * A module of its own, with no imports, because two callers need it and one of
 * them cannot import lib/auth.ts: proxy.ts runs before the app and lib/auth.ts
 * pulls in Prisma. Duplicating the literal instead would be a silent trap, and it
 * already was one: proxy.ts asked better-auth for the session cookie without
 * saying which prefix, better-auth looked for its own default, found nothing, and
 * redirected every valid member back to /login, which sent them straight back.
 * A login loop, from one missing argument.
 */

/**
 * Distinct from the dashboard's, so the two apps' sessions cannot be confused for
 * one another on a shared parent domain. Must equal `advanced.cookiePrefix` in
 * lib/auth.ts, which imports this to guarantee it.
 */
export const COOKIE_PREFIX = 'wup';

/** In production the cookie also carries the __Secure- prefix, so readers must agree. */
export const USE_SECURE_COOKIES = process.env.NODE_ENV === 'production';
