/**
 * Seed script — the super admin user, the amenity catalogue, and the signed locations.
 * Run with: pnpm db:seed
 *
 * The super admin user is seeded via Better Auth's API so the password is
 * properly hashed with scrypt and all auth tables are populated correctly.
 *
 * CREATE ONLY, for everything below the user. `pnpm build` runs this script, so a seed
 * that updated existing rows would silently revert the client's dashboard edits on every
 * deploy. Rows that already exist are counted and left alone; a row that should be
 * refreshed from the sheet is deleted in the dashboard first.
 *
 * The one thing that reaches an existing row is the restrooms backfill at the bottom,
 * and it is scoped so it cannot argue with a curated site. See seedDefaultAmenities.
 */

import { config } from 'dotenv';
config(); // load .env before anything else

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { SEED_AMENITIES } from './seed-data/amenities';
import { SEED_LOCATIONS } from './seed-data/locations';

// ── Validate required env vars ──────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Super Admin';

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
    console.log('🌱  Seeding super admin user…');

    // Check if super admin already exists
    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (existing) {
        // Ensure the role is set to SUPER_ADMIN even if user already exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((existing.role as any) !== 'SUPER_ADMIN') {
            await prisma.user.update({
                where: { email: ADMIN_EMAIL },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: { role: 'SUPER_ADMIN' as any },
            });
            console.log(`✅  Existing user promoted to SUPER_ADMIN: ${ADMIN_EMAIL}`);
        } else {
            console.log(`ℹ️   Super admin already exists: ${ADMIN_EMAIL} — skipping.`);
        }
        return;
    }

    // Create super admin via Better Auth API — handles password hashing automatically
    const result = await seedAuth.api.signUpEmail({
        body: {
            email: ADMIN_EMAIL!,
            password: ADMIN_PASSWORD!,
            name: ADMIN_NAME,
        },
    });

    if (!result?.user?.id) {
        console.error('❌  Failed to create super admin user:', result);
        process.exit(1);
    }

    // Elevate role to SUPER_ADMIN
    await prisma.user.update({
        where: { id: result.user.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { role: 'SUPER_ADMIN' as any, emailVerified: true },
    });

    console.log(`✅  Super admin seeded successfully: ${ADMIN_EMAIL}`);
}

// ── Amenity catalogue ────────────────────────────────────────────────────────
/**
 * Uploads every amenity option so the full set exists before anyone opens the
 * dashboard, which is where they are then assigned per site.
 *
 * Nothing existing is touched. Label, icon, sort order and the active switch belong to
 * the dashboard once the row exists, and this script runs on every build.
 */
async function seedAmenities() {
    const existing = new Set(
        (await prisma.amenity.findMany({ select: { slug: true } })).map((row) => row.slug)
    );

    const missing = SEED_AMENITIES.filter((amenity) => !existing.has(amenity.slug));

    if (missing.length > 0) {
        await prisma.amenity.createMany({ data: missing });
    }

    const total = await prisma.amenity.count();
    console.log(
        `✅  Amenities: ${missing.length} created, ${SEED_AMENITIES.length - missing.length} already present (${total} in catalogue)`
    );
}

// ── Locations ────────────────────────────────────────────────────────────────
/**
 * Uploads the signed sites from the sheet.
 *
 * amenities, pricePerKwh and connectors are absent from the seed input and are not set
 * here: the sheet says nothing about any of them, and they are the dashboard's to fill
 * in. Sites are published on creation, which matches how the finder already presents
 * them; hiding one is a dashboard toggle.
 */
async function seedLocations() {
    const existing = new Set(
        (await prisma.location.findMany({ select: { slug: true } })).map((row) => row.slug)
    );

    const missing = SEED_LOCATIONS.filter((location) => !existing.has(location.slug));

    if (missing.length > 0) {
        await prisma.location.createMany({ data: missing });
    }

    const total = await prisma.location.count();
    console.log(
        `✅  Locations: ${missing.length} created, ${SEED_LOCATIONS.length - missing.length} already present (${total} in database)`
    );
}

// ── Network defaults ─────────────────────────────────────────────────────────
/**
 * The amenity every WattUp site has.
 *
 * Restrooms are a network-wide fact rather than a per-site survey result, so the seed
 * puts them on. Everything else stays the dashboard's to assign.
 */
const DEFAULT_AMENITY_SLUG = 'restrooms';

/**
 * Backfills the default onto sites that have no amenities recorded at all.
 *
 * Deliberately not "add restrooms wherever it is missing". This script runs on every
 * build, so that version would re-add the amenity the next time anyone deploys, and a
 * client who had removed it from a site would watch it come back with no explanation.
 * Scoping it to sites with nothing recorded means it fills in the untouched ones and
 * never argues with a site somebody has actually curated.
 *
 * The one case it still overrides is a site stripped back to zero amenities on purpose.
 * That is a narrow, deliberate trade for being able to run this on every deploy.
 */
async function seedDefaultAmenities() {
    const amenity = await prisma.amenity.findUnique({
        where: { slug: DEFAULT_AMENITY_SLUG },
        select: { id: true },
    });

    if (!amenity) {
        console.warn(
            `⚠️   No "${DEFAULT_AMENITY_SLUG}" amenity in the catalogue, skipping the backfill.`
        );
        return;
    }

    const bare = await prisma.location.findMany({
        where: { amenities: { none: {} } },
        select: { id: true },
    });

    if (bare.length > 0) {
        await prisma.locationAmenity.createMany({
            data: bare.map(location => ({
                locationId: location.id,
                amenityId: amenity.id,
            })),
            skipDuplicates: true,
        });
    }

    const [withDefault, total] = await Promise.all([
        prisma.locationAmenity.count({ where: { amenityId: amenity.id } }),
        prisma.location.count(),
    ]);

    console.log(
        `✅  Restrooms: ${bare.length} added, ${withDefault} of ${total} sites now have it`
    );
}

async function main() {
    await seed();
    await seedAmenities();
    await seedLocations();
    await seedDefaultAmenities();
}

main()
    .catch((err) => {
        console.error('❌  Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
