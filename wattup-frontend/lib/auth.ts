import { sendMail } from '@/lib/email';
import { resetPasswordTemplate } from '@/lib/mail/reset-password';
import { ALL_ROLES, isRole, Permission, Role, ROLE_PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';

// ─── Admin plugin access control ──────────────────────────────────────────────
//
// Two permission systems meet here and must not be confused (ADR 0001 section 17):
//
//   Better Auth's static map below governs the admin plugin's OWN endpoints: createUser,
//   setRole, banUser, removeUser, session revocation. The plugin's hasPermission() looks
//   a role up in this map and nothing else.
//
//   The application's Permission enum plus role_permission and user_permission govern
//   everything the app itself gates, resolved per request in lib/permissions-server.ts.
//
// The map is DERIVED from ROLE_PERMISSIONS, the same defaults the database was seeded
// from, so a role added or changed in one place is reflected here without a second edit
// (checklist 4a.12). Per-user overrides never reach this map: an ADMIN granted
// DELETE_USERS individually still cannot call the plugin's removeUser, which is why
// every user action checks the resolved set first and treats the plugin as plumbing.

const statement = {
    user: [
        'create',
        'list',
        'set-role',
        'ban',
        'impersonate',
        'impersonate-admins',
        'delete',
        'set-password',
        'get',
        'update',
    ],
    session: ['list', 'revoke', 'delete'],
} as const;

type UserAction = (typeof statement.user)[number];
type SessionAction = (typeof statement.session)[number];

const ac = createAccessControl(statement);

/**
 * Which plugin operations a permission carries. A permission with no entry carries
 * none. Impersonation has no application permission and is reserved to SUPER_ADMIN
 * below; nothing in the dashboard impersonates anyone.
 */
const ADMIN_PLUGIN_GRANTS: Partial<
    Record<Permission, { user?: UserAction[]; session?: SessionAction[] }>
> = {
    [Permission.VIEW_USERS]: { user: ['list', 'get'] },
    [Permission.INVITE_USERS]: { user: ['create'] },
    [Permission.EDIT_USERS]: {
        user: ['update', 'set-password'],
        session: ['list', 'revoke', 'delete'],
    },
    [Permission.CHANGE_USER_ROLE]: { user: ['set-role'] },
    [Permission.BAN_USERS]: { user: ['ban'] },
    [Permission.DELETE_USERS]: { user: ['delete'] },
};

function accessFor(role: Role) {
    if (role === Role.SUPER_ADMIN) {
        return ac.newRole({ user: [...statement.user], session: [...statement.session] });
    }
    const user = new Set<UserAction>();
    const session = new Set<SessionAction>();
    for (const permission of ROLE_PERMISSIONS[role]) {
        const grant = ADMIN_PLUGIN_GRANTS[permission];
        grant?.user?.forEach(action => user.add(action));
        grant?.session?.forEach(action => session.add(action));
    }
    return ac.newRole({ user: [...user], session: [...session] });
}

const roles = Object.fromEntries(ALL_ROLES.map(role => [role, accessFor(role)])) as Record<
    Role,
    ReturnType<typeof accessFor>
>;

/**
 * There is no default role (ADR 0002 section 4.2, checklist 4a.26, 4a.31).
 *
 * The admin plugin still stamps `defaultRole` on any user created without one, and its
 * own fallback is the literal "user", so it is pointed at a value the Role enum does not
 * contain. If it ever fires, the hook below refuses the create and says so, and even if
 * the hook were removed the insert would fail at the database. Every path that creates
 * a user in this app supplies the role explicitly; public sign-up is closed twice over.
 */
const UNASSIGNED_ROLE = 'UNASSIGNED';

/** "john.doe@example.com" becomes "j***@example.com". Application logs never carry a whole address. */
function maskEmail(email: unknown): string {
    if (typeof email !== 'string') return '(no email)';
    const at = email.indexOf('@');
    if (at <= 0) return '***';
    return `${email[0]}***${email.slice(at)}`;
}

export const auth = betterAuth({
    appName: 'WattUp',
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    user: {
        additionalFields: {
            role: {
                type: 'string',
                // No defaultValue: see UNASSIGNED_ROLE.
                input: false, // role is set only by admin, never by public-facing APIs
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
        // Finding F10, checklist 4a.40: the library's own switch, so a renamed or added
        // sign-up route cannot quietly reopen registration. The before hook further
        // down is the second layer.
        disableSignUp: true,
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
                console.error('[Auth] sendResetPassword failed for', maskEmail(user.email), err);
                throw err;
            }
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh every 24h
        // What is cached here is identity, never authorisation: permissions are resolved
        // from the database on every request (lib/permissions-server.ts).
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
            // Password reset used as an email bomb. Better Auth renamed this
            // endpoint from /forget-password to /request-password-reset. On
            // 1.7.2 only /request-password-reset exists in the core routes
            // (dist/api/routes/password.mjs); the old name survives only in
            // the email-otp plugin, which this app does not use. The old key
            // is kept deliberately: a dead key is harmless, and it means a
            // downgrade cannot silently drop the rule.
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
            // The option is adminRoles; the singular spelling this file used to carry
            // was silently ignored and the plugin fell back to ["admin"]. Harmless in
            // practice, because with an explicit `roles` map the plugin only ever
            // consults that map, but the key is now the real one.
            adminRoles: [Role.SUPER_ADMIN, Role.ADMIN],
            defaultRole: UNASSIGNED_ROLE,
            roles,
        }),
        nextCookies(), // required for Next.js server component cookie support
    ],
    databaseHooks: {
        user: {
            create: {
                /**
                 * Runs after the admin plugin's own create hook, which is what stamps
                 * UNASSIGNED_ROLE on a user created without a role. A create that
                 * reaches here without a real role is a bug somewhere upstream, and
                 * this is where it becomes visible instead of a silent grant.
                 */
                before: async user => {
                    const role = (user as { role?: unknown }).role;
                    if (!isRole(role)) {
                        console.warn(
                            '[auth] refused to create a user without an explicit role:',
                            maskEmail(user.email),
                            'role received:',
                            role === UNASSIGNED_ROLE ? '(none)' : String(role)
                        );
                        throw new APIError('BAD_REQUEST', {
                            message: 'A role is required to create a user.',
                        });
                    }
                },
            },
        },
    },
    /**
     * Block all public sign-up attempts: the second layer under
     * emailAndPassword.disableSignUp above. Only accounts created by an
     * administrator, or by the seed scripts, can sign in.
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
