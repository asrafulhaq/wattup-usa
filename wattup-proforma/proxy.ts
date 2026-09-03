import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

import { COOKIE_PREFIX } from '@/lib/auth-cookies';
import { safeNext } from '@/lib/safe-next';

/**
 * Defence in depth in front of /tool, and the reason it exists is specific.
 *
 * The builder used to be served by a route handler, which could answer a
 * signed-out request with a plain 302 before it read anything. A React page cannot:
 * it has a loading.tsx, so Next streams the shell immediately and the redirect
 * arrives inside that stream, which means a signed-out caller gets 200 and an app
 * shell before being sent to /login. Nothing sensitive is in that payload (checked:
 * no field, note, default or model output appears in it) but answering a gated URL
 * with 200 is worse than answering it with a redirect, and it costs a wasted render.
 *
 * So a signed-out request is turned away here, before the page runs at all.
 *
 * This is NOT the membership check and must never be mistaken for one. It is sync,
 * it reads the session cookie only, and it makes no database call, so it cannot
 * know whether a session is still valid, whether the user is banned, or whether
 * they still hold ACCESS_PROFORMA. app/tool/page.tsx decides that with
 * requireMember, against the database, and it stays the authority. Everything this
 * proxy can do is cheaply refuse callers who plainly have no session.
 *
 * Named proxy.ts, not middleware.ts: Next 16 renamed it.
 */
export function proxy(request: NextRequest) {
    // The prefix is NOT optional here. lib/auth.ts renames these cookies so this
    // app's sessions cannot collide with the dashboard's, and without saying so
    // better-auth looks for its own default name, never finds one, and turns every
    // signed-in member away into a redirect loop.
    // Only the prefix: better-auth's getSessionCookie already tries __Secure-<name>
    // before the bare name, so production's secure cookie is found either way.
    if (getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX })) {
        return NextResponse.next();
    }

    const { pathname, search } = request.nextUrl;
    const url = new URL('/login', request.url);
    // Through safeNext like every other producer of a ?next=, so the one function
    // allowed to decide a redirect target keeps deciding it.
    url.searchParams.set('next', safeNext(pathname + search));
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/tool'],
};
