/**
 * Additional super-admin accounts, from ADMIN_EMAILS.
 *
 * Deliberately separate from seed.ts: that script also rewrites the amenity
 * catalogue and the signed locations, and nobody should have to run those to add
 * an administrator. This one touches the user and account tables only.
 *
 *   pnpm seed:admins
 *
 * For every address in ADMIN_EMAILS (comma separated):
 *   - if the user exists and is not SUPER_ADMIN, it is promoted;
 *   - if the user does not exist, it is created through Better Auth with
 *     ADMIN_PASSWORD (the same password as the primary account, by the
 *     client's instruction), marked emailVerified, as SUPER_ADMIN.
 *
 * The primary account (ADMIN_EMAIL) itself is seed.ts's concern and is not
 * touched here; only its password is reused. Like seed.ts, this writes to whatever DATABASE_URL points at:
 * a deliberate, production-affecting action, never a build step.
 */

import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';

const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

if (emails.length === 0) {
    console.error('❌  ADMIN_EMAILS must list at least one address (comma separated).');
    process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || !process.env.ADMIN_PASSWORD) {
    console.error('❌  DATABASE_URL, BETTER_AUTH_SECRET and ADMIN_PASSWORD must be set.');
    process.exit(1);
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Better Auth does the password hashing. The user is created through the admin
// plugin's createUser, which takes the role explicitly, so no defaultRole is set
// anywhere: User.role has no default in the schema (ADR 0002 section 4.2), and a
// create that forgot the role would be refused by the database rather than granted
// one. Called without headers, the endpoint needs no session (it is a server call),
// and with no `roles` map on this instance it accepts the enum's names as given.
const seedAuth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    plugins: [admin()],
});

/** "devripon.io@x" -> "Devripon". Placeholder; the person edits it on their profile. */
function displayName(email: string): string {
    const local = email.split('@')[0].split(/[._-]/)[0] || 'Admin';
    return local.charAt(0).toUpperCase() + local.slice(1);
}

async function ensureSuperAdmin(email: string): Promise<void> {
    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
    });

    if (existing) {
        if (existing.role === 'SUPER_ADMIN') {
            console.log(`ℹ️   ${email}: already SUPER_ADMIN, nothing to do.`);
            return;
        }
        await prisma.user.update({ where: { id: existing.id }, data: { role: 'SUPER_ADMIN' } });
        console.log(`✅  ${email}: promoted ${existing.role} → SUPER_ADMIN.`);
        return;
    }

    const result = await seedAuth.api.createUser({
        body: {
            email,
            password: ADMIN_PASSWORD,
            name: displayName(email),
            // Typed as the plugin's built-in "admin" | "user" because this instance
            // declares no roles map; at runtime the value is passed through as is.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: 'SUPER_ADMIN' as any,
            data: { emailVerified: true },
        },
    });
    if (!result?.user?.id) {
        console.error(`❌  ${email}: Better Auth did not return a user.`);
        process.exit(1);
    }
    console.log(`✅  ${email}: created as SUPER_ADMIN with ADMIN_PASSWORD.`);
}

async function main() {
    console.log(`🌱  Ensuring ${emails.length} super-admin account(s)…`);
    for (const email of emails) await ensureSuperAdmin(email);
}

main()
    .catch((err) => {
        console.error('❌  seed:admins failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
