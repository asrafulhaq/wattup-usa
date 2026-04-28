/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

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
 * Retrieves the current logged-in user's information using Better Auth.
 */
export async function getAdminSession() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || session.user.role !== 'admin') {
            return null;
        }

        return {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            name: session.user.name,
            image: session.user.image,
        };
    } catch {
        return null;
    }
}

/**
 * Request password reset using Better Auth.
 */
export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string | null;
    if (!email) return { success: false, error: 'Email is required' };

    try {
        await auth.api.requestPasswordReset({
            body: {
                email,
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
            },
        });

        return {
            success: true,
            message: 'If an account exists, a reset link has been sent.',
        };
    } catch (error: any) {
        console.error('Reset Request Error:', error);
        return { success: false, error: 'Failed to process request' };
    }
}

/**
 * Reset password using Better Auth.
 */
export async function resetPassword(formData: FormData) {
    const token = formData.get('token') as string | null;
    const newPassword = formData.get('password') as string | null;

    if (!token || !newPassword) {
        return { success: false, error: 'Missing fields' };
    }

    try {
        await auth.api.resetPassword({
            body: {
                token,
                newPassword,
            },
        });

        return { success: true, message: 'Password reset successfully' };
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}

/**
 * Updates user email using Better Auth.
 * Verifies current password via Better Auth changePassword as a pre-check,
 * then calls changeEmail which sends a verification link.
 */
export async function updateEmail(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string | null;
    const newEmail = formData.get('newEmail') as string | null;

    if (!currentPassword) return { success: false, error: 'Current password is required' };
    if (!newEmail) return { success: false, error: 'New email is required' };

    try {
        const h = await headers();

        const session = await auth.api.getSession({ headers: h });
        if (!session) return { success: false, error: 'Not authenticated' };

        // Verify the current password by checking against the stored credential hash.
        // We use verifyPassword from Better Auth's internal ctx via a dummy changePassword
        // that we know won't change anything if we feed the same password.
        // More robustly: query the account credential record and verify the hash.
        const prisma = (await import('@/lib/prisma')).default;
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                providerId: 'credential',
            },
            select: { password: true },
        });

        if (!account?.password) {
            return { success: false, error: 'No password set on this account' };
        }

        // Use the same scrypt verifier that Better Auth uses internally
        const { timingSafeEqual } = await import('crypto');
        const { scrypt } = await import('crypto');
        const [N, r, p, salt, storedKey] = account.password.split(':');

        if (!salt || !storedKey) {
            return { success: false, error: 'Invalid credential format' };
        }

        const verified = await new Promise<boolean>((resolve, reject) => {
            scrypt(
                currentPassword,
                salt,
                64,
                { N: Number(N), r: Number(r), p: Number(p) },
                (err, derivedKey) => {
                    if (err) return reject(err);
                    try {
                        const stored = Buffer.from(storedKey, 'hex');
                        resolve(timingSafeEqual(derivedKey, stored));
                    } catch {
                        resolve(false);
                    }
                }
            );
        });

        if (!verified) {
            return { success: false, error: 'Incorrect current password' };
        }

        // Password confirmed — request email change (Better Auth sends verification email)
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
