import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';
import { after } from 'next/server';

import prisma from '@/lib/prisma';

/**
 * Better Auth for the Site Pro-Forma Builder.
 *
 * This app is OTP-only. There is no password, no OAuth, and no sign-up: users are
 * created in the wattupusa.com dashboard and merely recognised here.
 *
 * Read ADR 0001 section 7 before changing anything below. Better Auth's OTP
 * endpoints deliberately leak whether an address belongs to a user, which is the
 * one thing this app must never do, so they are never exposed to the browser —
 * app/api/gate/* wraps them and normalises every observable.
 */

function required(name: string): string {
    const value = process.env[name];
    // Fail closed. A missing secret must break the app, never quietly disable the gate.
    if (!value) throw new Error(`[auth] Missing required environment variable: ${name}`);
    return value;
}

export const auth = betterAuth({
    appName: 'WattUp Pro-Forma',
    secret: required('BETTER_AUTH_SECRET'),
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',

    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    // No passwords in this app at all. The dashboard owns credentials.
    emailAndPassword: { enabled: false },

    session: {
        expiresIn: 60 * 60 * 24 * Number(process.env.SESSION_TTL_DAYS ?? 7),
        updateAge: 60 * 60 * 24,
        // Cheap re-reads for rendering. NOT an authorisation decision: the gate
        // re-checks membership against the database on every gated request.
        cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    plugins: [
        emailOTP({
            otpLength: 6,

            // Four plugin defaults are wrong for this app. Each override is deliberate:
            //
            //   expiresIn       default 300  → the spec is a 10 minute code
            //   allowedAttempts default 3    → the spec is 5
            //   storeOTP        default      → 'plain' would store codes in clear,
            //                                  and the spec says never store the code
            //   disableSignUp   default false→ a sign-in would CREATE a user, which
            //                                  would make the member list meaningless
            expiresIn: Number(process.env.OTP_TTL_SECONDS ?? 600),
            allowedAttempts: 5,
            storeOTP: 'hashed',
            disableSignUp: true,

            // A fresh code on every request, so an old one cannot be replayed.
            resendStrategy: 'rotate',

            async sendVerificationOTP({ email, otp, type }) {
                // Better Auth calls this once the hashed code is stored, and AWAITS
                // it (runInBackgroundOrAwait, dist/context/create-context.mjs). If
                // the Resend round trip ran here, a member's request-code response
                // would be hundreds of milliseconds slower than a non-member's, which
                // is the one thing ADR 0001 section 7 forbids. So the send is
                // scheduled with Next's after(): this callback returns as soon as the
                // work is queued, and the mail goes out once the response has been
                // sent. after() is request scoped, and this callback only ever runs
                // inside a request, from app/api/gate/request-code through auth.api;
                // that route itself calls Better Auth from inside after(), and after()
                // nests (next/dist/docs, functions/after.md).
                //
                // Whether this is called at all is decided by the member directory
                // check in that route, before Better Auth is involved. Never log `otp`.
                const { maskEmail, sendOtpEmail } = await import('@/lib/email');
                const send = () =>
                    sendOtpEmail({ email, otp, type }).catch((error: unknown) => {
                        console.error('[mail] OTP send failed', {
                            to: maskEmail(email),
                            message: error instanceof Error ? error.message : String(error),
                        });
                    });
                try {
                    after(send);
                } catch {
                    // Outside a request context (a script, a seed) after() throws.
                    // Send inline rather than lose the code silently.
                    await send();
                }
            },
        }),

        nextCookies(),
    ],

    advanced: {
        useSecureCookies: process.env.NODE_ENV === 'production',
        // Distinct from the dashboard's cookies, so the two apps' sessions cannot
        // be confused for one another on a shared parent domain.
        cookiePrefix: 'wup',
        database: { generateId: false },
    },

    trustedOrigins: [
        process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
        // Vercel preview deployments serve from a per-deploy host. The gate routes
        // check origin against the request's own host, but the tool's sign-out
        // POST goes through Better Auth's check and must pass here too.
        ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
