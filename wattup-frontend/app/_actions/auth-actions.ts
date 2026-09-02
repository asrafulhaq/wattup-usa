/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Deduplicates auth.api.getSession calls within the same request render tree.
//
// disableCookieCache is what closes finding F16. lib/auth.ts keeps a five minute signed
// cookie cache of the session, and proxy.ts decides the dashboard redirect from cookie
// PRESENCE alone, by design, since it may not touch the database. Together those meant a
// session_data cookie captured while a session was live kept rendering dashboard pages
// for up to five minutes after the session was revoked or the account banned. Reads only,
// because every action resolves permissions from the database anyway, but a revoked
// session should stop working when it is revoked and not a few minutes later.
//
// The cost is one session read per request render tree, not per call: React's cache()
// below already collapses the many callers of getSession into one. wattup-proforma pays
// exactly this on every gated request for the same reason (checklist 3.13).
const getCachedSession = cache(async () => {
    const h = await headers();
    return auth.api.getSession({ headers: h, query: { disableCookieCache: true } });
});

/**
 * Logout action — signs out via Better Auth server API and redirects.
 * nextCookies() plugin in auth.ts handles the cookie clearing automatically.
 */
export async function logout() {
    await auth.api.signOut({
        headers: await headers(),
    });
    redirect('/admin');
}

/**
 * Returns session for any authenticated user regardless of role: identity only, never
 * an authorisation answer. lib/permission-guard.ts builds on this to resolve what the
 * caller may do. (getAdminSession, the role-gated variant, is gone: every module that
 * used it now checks a permission.)
 */
export async function getSession() {
    try {
        const session = await getCachedSession();

        if (!session) return null;

        return {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role as string,
            name: session.user.name,
            image: session.user.image,
        };
    } catch {
        return null;
    }
}

/**
 * Updates user email using Better Auth.
 * Confirms the current password through Better Auth itself (see
 * verifyCurrentPassword below), then calls changeEmail, which sends the
 * verification link.
 */
export async function updateEmail(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string | null;
    const newEmail = formData.get('newEmail') as string | null;

    if (!currentPassword) return { success: false, error: 'Current password is required' };
    if (!newEmail) return { success: false, error: 'New email is required' };

    try {
        const h = await headers();

        const session = await getCachedSession();
        if (!session) return { success: false, error: 'Not authenticated' };

        const verified = await verifyCurrentPassword(currentPassword, h);
        if (!verified) {
            return { success: false, error: 'Incorrect current password' };
        }

        // Password confirmed. Request the email change; Better Auth sends the verification email.
        await auth.api.changeEmail({
            body: { newEmail },
            headers: h,
        });

        return {
            success: true,
            message: 'Email change requested. Check your current inbox to confirm the change.',
        };
    } catch (error: any) {
        console.error('Update Email Error:', error);
        const msg =
            error?.body?.message ||
            error?.message ||
            'Failed to update email';
        return { success: false, error: msg };
    }
}

/**
 * Confirms the signed-in user's current password with Better Auth's own
 * server-scoped verify-password endpoint. Finding F6, checklist B.4 and B.5.
 *
 * The previous implementation read the credential row itself, split the stored
 * string on ':' into scrypt cost parameters, salt and key, and re-derived the
 * hash with node:crypto. That tied this action to the serialisation Better Auth
 * happens to use today. Any future version that changes it, whether a different
 * KDF, a different separator or a versioned prefix, would have made every
 * password check here fail silently or throw, with nothing at compile time to
 * say so. B.5 asked for a re-check on every upgrade for exactly that reason;
 * with the parse gone there is nothing left to re-check.
 *
 * auth.api.verifyPassword is the library's answer to this question. It resolves
 * the session from the request headers (sensitiveSessionMiddleware, so the
 * cookie cache is bypassed), finds the credential account for that user, and
 * compares through ctx.context.password.verify, the same verifier that sign-in
 * and change-password use, so a custom hasher configured under
 * emailAndPassword.password would be honoured as well. The stored hash never
 * leaves Better Auth. The endpoint is metadata.scope "server", so it is not
 * routed under /api/auth and cannot be used as a password oracle from outside,
 * and unlike a signInEmail probe it mints no session.
 *
 * Alternatives considered: verifyPassword from better-auth/crypto would still
 * have this module reading the hash out of the account table and would skip a
 * custom verifier; changeEmail on 1.7.2 takes no password, so it cannot stand in
 * as the check.
 *
 * Returns false only for INVALID_PASSWORD. Anything else (no session, the
 * database being unreachable) is rethrown so updateEmail's catch reports it the
 * way it always has.
 */
async function verifyCurrentPassword(
    password: string,
    h: Awaited<ReturnType<typeof headers>>
): Promise<boolean> {
    try {
        const { status } = await auth.api.verifyPassword({
            body: { password },
            headers: h,
        });
        return status === true;
    } catch (error) {
        if (isInvalidPasswordError(error)) return false;
        throw error;
    }
}

/**
 * True for the APIError verify-password throws on a wrong password. Read from
 * body.code, the shape every Better Auth APIError carries and the field the
 * catch in updateEmail already reads, rather than by instanceof, so it does not
 * depend on which copy of the error class a bundle happens to load.
 */
function isInvalidPasswordError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const body: unknown = (error as { body?: unknown }).body;
    if (typeof body !== 'object' || body === null) return false;
    return (body as { code?: unknown }).code === 'INVALID_PASSWORD';
}

/**
 * Updates user password using Better Auth.
 */
export async function updatePassword(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string | null;
    const newPassword = formData.get('newPassword') as string | null;
    const confirmNewPassword = formData.get('confirmNewPassword') as string | null;

    if (!currentPassword) return { success: false, error: 'Current password is required' };
    if (!newPassword) return { success: false, error: 'New password is required' };
    if (newPassword.length < 8) return { success: false, error: 'Password must be at least 8 characters' };
    if (newPassword !== confirmNewPassword) return { success: false, error: 'Passwords do not match' };

    try {
        const h = await headers();

        await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            },
            headers: h,
        });

        return { success: true, message: 'Password updated successfully' };
    } catch (error: any) {
        console.error('Update Password Error:', error);
        const msg =
            error?.body?.message ||
            error?.message ||
            'Failed to update password. Check your current password and try again.';
        return { success: false, error: msg };
    }
}

/**
 * Clears a session the server will not accept, then sends the visitor to sign in.
 *
 * This exists because proxy.ts can only see whether the session cookie is *present*: it
 * runs sync, with no database, so it cannot tell a valid token from an expired or
 * revoked one. A stale cookie therefore walks past the proxy, the page then finds no
 * session, and if the page answered by redirecting to /admin the proxy would send it
 * straight back to /dashboard, forever.
 *
 * So the cookie has to actually go before we redirect, or the loop simply resumes.
 * signOut is tried first because it is the supported path and revokes the row; when the
 * token is already invalid it can refuse, and the cookie is then removed directly.
 */
export async function endStaleSession() {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch {
        // Expected when the token is no longer one the server recognises. The cookie is
        // still in the browser and still enough to fool the proxy, so it goes below.
    }

    try {
        const jar = await cookies();
        for (const cookie of jar.getAll()) {
            // Covers the default name, the __Secure- prefixed production variant, and the
            // signed cookie cache, without hardcoding a name that a config change breaks.
            if (
                cookie.name.includes('session_token') ||
                cookie.name.includes('session_data') ||
                cookie.name.startsWith('better-auth')
            ) {
                jar.delete(cookie.name);
            }
        }
    } catch (error) {
        console.error('End Stale Session Error:', error);
    }

    redirect('/admin');
}
