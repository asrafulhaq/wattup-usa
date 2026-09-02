import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ['/dashboard'];

// Auth-only routes — authenticated users are redirected away from these
const AUTH_ONLY_PREFIXES = ['/admin', '/forgot-password', '/reset-password'];

// The login page — redirect here if unauthenticated
const LOGIN_PAGE = '/admin';

// Where to send authenticated users who try to access auth routes
const DASHBOARD_PAGE = '/dashboard';

// Sync — reads the session cookie only, no DB call, no async
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
    const isAuthOnly = AUTH_ONLY_PREFIXES.some(p => pathname.startsWith(p));

    if (!isProtected && !isAuthOnly) return NextResponse.next();

    const session = getSessionCookie(request);

    if (isProtected && !session) {
        const loginUrl = new URL(LOGIN_PAGE, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthOnly && session) {
        return NextResponse.redirect(new URL(DASHBOARD_PAGE, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin',
        '/forgot-password',
        '/reset-password',
    ],
};
