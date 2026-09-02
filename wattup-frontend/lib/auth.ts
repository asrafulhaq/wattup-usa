import { sendMail } from '@/lib/email';
import { resetPasswordTemplate } from '@/lib/mail/reset-password';
import prisma from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';

// ─── Admin plugin access control ──────────────────────────────────────────────
// Maps our custom role names to Better Auth admin plugin permissions.
// Required because the admin plugin's hasPermission() looks up roles in this map.

const ac = createAccessControl({
    user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'impersonate-admins', 'delete', 'set-password', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
});

const superAdminAc = ac.newRole({
    user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'impersonate-admins', 'delete', 'set-password', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
});

const adminAc = ac.newRole({
    user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
});

const editorAc = ac.newRole({ user: ['list', 'get'], session: [] });
const collaboratorAc = ac.newRole({ user: [], session: [] });

export const auth = betterAuth({
    appName: 'WattUp',
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'COLLABORATOR',
                input: false, // role is set only by admin — never by public-facing APIs
            },
            bio: {
                type: 'string',
                defaultValue: '',
                input: true, // each user can update their own bio
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        revokeSessionsOnPasswordReset: true,
        async sendResetPassword({
            user,
            url,
        }: {
            user: { email: string; name?: string };
            url: string;
        }) {
            try {
                const { subject, html } = resetPasswordTemplate({ name: user.name, url });
                await sendMail({ email: user.email, subject, html });
            } catch (err) {
                console.error('[Auth] sendResetPassword failed for', user.email, err);
                throw err;
            }
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh every 24h
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 min cache
        },
    },
    /**
     * Rate limiting (finding F9).
     *
     * `enabled` is set explicitly. The library default is "production only",
     * which makes local behaviour differ from deployed behaviour.
     *
     * Keys are matched against the request path with the `/api/auth` base
     * path already stripped, so `/sign-in/email` means
     * `/api/auth/sign-in/email`. A custom rule replaces both the generic
     * limit and the library's built-in per-endpoint default for that path.
     *
     * Storage stays `memory`, the default, so no `rateLimit` table and no
     * migration. Memory storage is per process: on serverless each instance
     * counts separately, so the effective limit is looser than the numbers
     * below. Moving to `database` or secondary storage is tracked separately.
     */
    rateLimit: {
        enabled: true,
        customRules: {
            // Password guessing against a known address.
            '/sign-in/email': { window: 60, max: 5 },
            // Password reset used as an email bomb. Better Auth has renamed
            // this endpoint across versions; both names are pinned so an
            // upgrade cannot silently drop the rule.
            '/forget-password': { window: 300, max: 3 },
            '/request-password-reset': { window: 300, max: 3 },
            // Token guessing against a live reset link.
            '/reset-password': { window: 300, max: 5 },
            // The link-click GET callback, /reset-password/:token, which
            // answers whether a token is valid. Keys are exact, so it needs
            // its own wildcard entry.
            '/reset-password/*': { window: 300, max: 5 },
        },
    },
    plugins: [
        admin({
            adminRole: ['SUPER_ADMIN', 'ADMIN'],
            defaultRole: 'COLLABORATOR',
            roles: {
                SUPER_ADMIN: superAdminAc,
                ADMIN: adminAc,
                EDITOR: editorAc,
                COLLABORATOR: collaboratorAc,
            },
        }),
        nextCookies(), // required for Next.js server component cookie support
    ],
    /**
     * Block all public sign-up attempts.
     * Only the seeded admin account (created via the seed script) can sign in.
     */
    hooks: {
        before: async context => {
            if (!context.request) return;
            const url = new URL(context.request.url);
            if (url.pathname.endsWith('/sign-up/email')) {
                throw new APIError('FORBIDDEN', {
                    message:
                        'Public registration is disabled. Contact an administrator.',
                });
            }
        },
    },
    advanced: {
        useSecureCookies: process.env.NODE_ENV === 'production',
        database: {
            generateId: false, // use Prisma's default cuid
        },
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

