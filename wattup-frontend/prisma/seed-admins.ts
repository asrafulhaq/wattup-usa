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
 *   - if the user does not exist, it is created through Better Auth with a
 *     random password that is never printed or stored anywhere but the hash,
 *     marked emailVerified, and promoted. The person then sets their own
 *     password with "Forgot password" on /admin.
 *
 * The primary account (ADMIN_EMAIL / ADMIN_PASSWORD) is seed.ts's concern and
 * is not read here. Like seed.ts, this writes to whatever DATABASE_URL points at:
 * a deliberate, production-affecting action, never a build step.
 */

import 'dotenv/config';
import { randomBytes } from 'node:crypto';

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
if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
    console.error('❌  DATABASE_URL and BETTER_AUTH_SECRET must be set.');
    process.exit(1);
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Same shape as seed.ts: Better Auth does the password hashing.
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

    // 32 random bytes, base64url: long enough that nobody will guess it and nobody
    // needs to know it. The person sets a real one with "Forgot password".
    const password = randomBytes(32).toString('base64url');

    const result = await seedAuth.api.signUpEmail({
        body: { email, password, name: displayName(email) },
    });
    if (!result?.user?.id) {
        console.error(`❌  ${email}: Better Auth did not return a user.`);
        process.exit(1);
    }

    await prisma.user.update({
        where: { id: result.user.id },
        data: { role: 'SUPER_ADMIN', emailVerified: true },
    });
    console.log(`✅  ${email}: created as SUPER_ADMIN. Set a password with "Forgot password" on /admin.`);
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
