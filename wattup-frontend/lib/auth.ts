import { contextFromHeaders, logActivity, maskEmail as maskForLog } from '@/lib/activity-log';
import { sendMail } from '@/lib/email';
import { resetPasswordTemplate } from '@/lib/mail/reset-password';
import { ALL_ROLES, isRole, Permission, Role, ROLE_PERMISSIONS } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
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

/**
 * The address and user agent of the request a Better Auth hook is running inside, or
 * null when there is no request (a script, a seed). One reader for both audit hooks, so
 * a success and a refusal from the same client record the same address.
 */
function requestContextOf(context: unknown): { ipAddress: string | null; userAgent: string | null } | null {
    const request = (context as { request?: Request } | null | undefined)?.request;
    return request ? contextFromHeaders(request.headers) : null;
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
     * Storage is `database` (checklist B.10, S.4.6): the counters live in
     * the `auth_rate_limit` table, the `RateLimit` model at the end of
     * prisma/schema.prisma, so every serverless instance shares one count
     * and the numbers below are the real limits. Memory storage was per
     * process, which made the effective limit N times these on Vercel.
     * `modelName` is the Prisma client delegate (`prisma.rateLimit`), not
     * the SQL table; the table name comes from the model's @@map. Each
     * check is one guarded increment on that row, so concurrent requests
     * cannot all pass a stale read. scripts/rate-limit-storage-check.ts
     * proves the wiring without a database.
     */
    rateLimit: {
        enabled: true,
        storage: 'database',
        modelName: 'rateLimit',
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
        session: {
            create: {
                /**
                 * Every successful sign-in, into the same activity_log the pro-forma app
                 * writes to (checklist 4b.6). A session row IS a successful sign-in, and
                 * it already carries the address and user agent Better Auth recorded, so
                 * this hook needs no request of its own and cannot disagree with the
                 * session it is describing.
                 *
                 * Awaited rather than deferred: this is the audit trail for
                 * authentication, and logActivity never throws, so the cost is one insert
                 * and the failure mode is a log line rather than a failed sign-in.
                 */
                after: async (session, endpointContext) => {
                    try {
                    const userId = (session as { userId?: unknown }).userId;
                    if (typeof userId !== 'string') return;
                    const user = await prisma.user
                        .findUnique({ where: { id: userId }, select: { email: true } })
                        .catch(() => null);
                    if (!user) return;
                    await logActivity(
                        {
                            event: 'signin.success',
                            target: { id: userId, email: user.email },
                        },
                        // Prefer the request's own headers, read the same way the
                        // refusal path reads them. Better Auth stores the address on the
                        // session in its expanded form, so taking it from there wrote
                        // 0000:0000:...:0001 next to the ::1 a failed sign-in recorded:
                        // one address, two spellings, in a table a person reads down.
                        // The session's values remain the fallback for a session created
                        // outside a request.
                        requestContextOf(endpointContext) ?? {
                            ipAddress: (session as { ipAddress?: string | null }).ipAddress ?? null,
                            userAgent: (session as { userAgent?: string | null }).userAgent ?? null,
                        }
                    );
                    } catch (error) {
                        // An audit hook must never be the reason a sign-in fails.
                        console.error('[auth] signin.success audit failed', error);
                    }
                },
            },
        },
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
        /**
         * The other half of 4b.6: a sign-in that was REFUSED. The success half is the
         * session hook above, because a session row is the success; there is no row for
         * a failure, so it has to be caught here, on the way out of the endpoint.
         *
         * Only /sign-in/email, and only when the endpoint returned an error. Better Auth
         * puts what the handler produced on `context.context.returned`, an APIError for
         * a refusal. Anything else is a success, already recorded by the session hook.
         *
         * The address is the one the caller offered, which is exactly what an audit of
         * failed sign-ins is for: it is not a user id, because there may be no such user.
         * Never the password, and never which of "no such account" or "wrong password"
         * it was, since the response does not say either.
         */
        after: createAuthMiddleware(async context => {
            try {
            const request = context.request;
            if (!request) return;
            if (!new URL(request.url).pathname.endsWith('/sign-in/email')) return;

            // `returned` is on the endpoint context at runtime but not on
            // AuthMiddleware's input type, which describes the request rather than the
            // result, so it is read through unknown. If a future version stops putting
            // it there this hook goes quiet rather than throwing, and the test below
            // fails, which is the point of having one.
            const returned = (context as unknown as { context?: { returned?: unknown } }).context
                ?.returned;
            if (!(returned instanceof APIError)) return;

            const body = context.body as { email?: unknown } | undefined;
            const email = typeof body?.email === 'string' ? body.email : null;
            if (!email) return;

            const existing = await prisma.user
                .findUnique({ where: { email }, select: { id: true } })
                .catch(() => null);

            await logActivity(
                {
                    event: 'signin.failed',
                    target: { id: existing?.id ?? null, email },
                    meta: { status: returned.status },
                },
                contextFromHeaders(request.headers)
            );
            console.warn('[auth] sign-in refused for', maskForLog(email));
            } catch (error) {
                // Same rule as the session hook: recording a refusal must not turn it
                // into a 500, which would tell an attacker more than the refusal does.
                console.error('[auth] signin.failed audit failed', error);
            }
        }),
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
