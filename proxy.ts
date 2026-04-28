import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ['/dashboard'];

// Auth-only routes — authenticated users are redirected away from these
const AUTH_ONLY_PREFIXES = ['/admin', '/forgot-password', '/reset-password'];

// The login page — redirect here if unauthenticated
const LOGIN_PAGE = '/admin';

// Where to send authenticated users who try to access auth routes
const DASHBOARD_PAGE = '/dashboard';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
    );

    const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
    );

    // Neither protected nor auth-only — let it through
    if (!isProtected && !isAuthOnly) {
        return NextResponse.next();
    }

    // Fetch session from Better Auth
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (isProtected && !session) {
        // Unauthenticated user trying to access a protected route → login
        const loginUrl = new URL(LOGIN_PAGE, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthOnly && session) {
        // Authenticated user trying to access an auth route → dashboard
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
