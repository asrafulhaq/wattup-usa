import 'server-only';

import { LOCATIONS_TAG } from '@/lib/locations/server';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * The numbers on the overview screen.
 *
 * Counted in the database rather than by loading rows and measuring them in the
 * browser, so the page costs one round of aggregates however large the network grows.
 *
 * Tagged alongside the rest of the locations data, so publishing a site changes this
 * screen at the same moment it changes the map.
 */
export interface OverviewStats {
    locationsTotal: number;
    locationsPublished: number;
    locationsHidden: number;
    open: number;
    comingSoon: number;
    underConstruction: number;
    chargingBays: number;
    amenitiesActive: number;
    amenitiesTotal: number;
    amenitiesAssigned: number;
    /** Sites with no tariff set. The client has not agreed one, so this starts at all of them. */
    withoutPrice: number;
    articlesTotal: number;
    articlesPublished: number;
}

/**
 * Two statements rather than twelve, and the reason is not only speed.
 *
 * This used to be a Promise.all of twelve counts and one aggregate. Warm it cost
 * nothing, because cacheLife('hours') keeps it out of every steady state trace. Cold it
 * was the worst moment in the application: the SQL tap showed the twelve arriving in
 * waves rather than in parallel, two, then two, then a 1 073 ms gap, then eight, for
 * 2 029 ms of wall clock on queries that each execute in under 0.3 ms. The gap is `pg`
 * opening connections it does not have, each one a TLS handshake to Neon, because
 * lib/prisma.ts constructs PrismaPg with only a connection string and so takes the
 * driver's default pool of ten. That is a spike on every Vercel cold start.
 *
 * The second reason is correctness. Twelve independent statements are twelve moments in
 * time: locationsTotal could be read before a site is published and locationsPublished
 * after it, and locationsHidden below is their difference, so the screen could show a
 * negative number of hidden sites. One statement over `location` cannot disagree with
 * itself.
 *
 * count(*) FILTER is Postgres' way of asking several questions of one scan. Prisma has
 * no expression for it, hence $queryRaw. There is no interpolation in either statement
 * and no caller input reaches them, so there is no injection surface: they are constant
 * strings. The table names are the @@map names from prisma/schema.prisma, and a test in
 * lib/dashboard/__tests__/overview.test.ts reads the schema and fails if a rename makes
 * them wrong, because a raw query is exactly the kind that breaks silently at runtime.
 */
interface LocationCounts {
    total: number;
    published: number;
    live: number;
    planned: number;
    under_construction: number;
    without_price: number;
    charging_bays: number;
}

interface CatalogueCounts {
    amenities_active: number;
    amenities_total: number;
    amenities_assigned: number;
    articles_total: number;
    articles_published: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG, 'posts');

    const [[locations], [catalogue]] = await Promise.all([
        prisma.$queryRaw<LocationCounts[]>`
            SELECT
                (count(*))::int                                              AS total,
                (count(*) FILTER (WHERE published))::int                     AS published,
                (count(*) FILTER (WHERE status = 'LIVE'))::int               AS live,
                (count(*) FILTER (WHERE status = 'PLANNED'))::int            AS planned,
                (count(*) FILTER (WHERE status = 'UNDER_CONSTRUCTION'))::int AS under_construction,
                (count(*) FILTER (WHERE "pricePerKwh" IS NULL))::int         AS without_price,
                (COALESCE(sum("chargerCount"), 0))::int                      AS charging_bays
            FROM location
        `,
        prisma.$queryRaw<CatalogueCounts[]>`
            SELECT
                (SELECT count(*) FROM amenity WHERE active)::int                 AS amenities_active,
                (SELECT count(*) FROM amenity)::int                              AS amenities_total,
                (SELECT count(*) FROM location_amenity)::int                     AS amenities_assigned,
                (SELECT count(*) FROM "Posts")::int                              AS articles_total,
                (SELECT count(*) FROM "Posts" WHERE status = 'Published')::int   AS articles_published
        `,
    ]);

    return {
        locationsTotal: locations.total,
        locationsPublished: locations.published,
        locationsHidden: locations.total - locations.published,
        open: locations.live,
        comingSoon: locations.planned,
        underConstruction: locations.under_construction,
        chargingBays: locations.charging_bays,
        amenitiesActive: catalogue.amenities_active,
        amenitiesTotal: catalogue.amenities_total,
        amenitiesAssigned: catalogue.amenities_assigned,
        withoutPrice: locations.without_price,
        articlesTotal: catalogue.articles_total,
        articlesPublished: catalogue.articles_published,
    };
}
