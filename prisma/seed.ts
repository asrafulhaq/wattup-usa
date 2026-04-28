/**
 * Seed script — creates the admin user from environment variables.
 * Run with: pnpm db:seed
 *
 * The admin user is seeded via Better Auth's API so the password is
 * properly hashed with scrypt and all auth tables are populated correctly.
 */

import { config } from 'dotenv';
config(); // load .env before anything else

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';

// ── Validate required env vars ──────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
        '❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file'
    );
    process.exit(1);
}

if (!process.env.BETTER_AUTH_SECRET) {
    console.error('❌  BETTER_AUTH_SECRET must be set in your .env file');
    process.exit(1);
}

// ── Prisma client (standalone, not the shared singleton) ────────────────────
const dbAdapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter: dbAdapter });

// ── Minimal Better Auth instance for seeding ────────────────────────────────
const seedAuth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    plugins: [admin()],
});

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
    console.log('🌱  Seeding admin user…');

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (existing) {
        // Ensure the role is set to admin even if user already exists
        if (existing.role !== 'admin') {
            await prisma.user.update({
                where: { email: ADMIN_EMAIL },
                data: { role: 'admin' },
            });
            console.log(`✅  Existing user promoted to admin: ${ADMIN_EMAIL}`);
        } else {
            console.log(`ℹ️   Admin already exists: ${ADMIN_EMAIL} — skipping.`);
        }
        return;
    }

    // Create admin via Better Auth API — handles password hashing automatically
    const result = await seedAuth.api.signUpEmail({
        body: {
            email: ADMIN_EMAIL!,
            password: ADMIN_PASSWORD!,
            name: ADMIN_NAME,
        },
    });

    if (!result?.user?.id) {
        console.error('❌  Failed to create admin user:', result);
        process.exit(1);
    }

    // Elevate role to "admin"
    await prisma.user.update({
        where: { id: result.user.id },
        data: { role: 'admin', emailVerified: true },
    });

    console.log(`✅  Admin seeded successfully: ${ADMIN_EMAIL}`);
}

seed()
    .catch((err) => {
        console.error('❌  Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
