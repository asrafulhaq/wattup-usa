import { sendMail } from '@/lib/nodemailer';
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
            await sendMail({
                email: user.email,
                subject: 'Reset your WattUp password',
                html: `
                    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
                        <h2 style="font-size:22px;font-weight:700;color:#0f1117">Reset your password</h2>
                        <p style="color:#555;font-size:15px;line-height:1.6">
                            Hi${user.name ? ` ${user.name}` : ''},<br/>
                            We received a request to reset the password for your WattUp account.
                            Click the button below to choose a new password.
                        </p>
                        <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#197dff;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
                            Reset Password
                        </a>
                        <p style="color:#999;font-size:13px">
                            This link expires in 1 hour. If you didn&apos;t request a reset, you can safely ignore this email.
                        </p>
                    </div>
                `,
            });
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

