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

export async function getOverviewStats(): Promise<OverviewStats> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG, 'posts');

    const [
        locationsTotal,
        locationsPublished,
        open,
        comingSoon,
        underConstruction,
        bays,
        amenitiesActive,
        amenitiesTotal,
        amenitiesAssigned,
        withoutPrice,
        articlesTotal,
        articlesPublished,
    ] = await Promise.all([
        prisma.location.count(),
        prisma.location.count({ where: { published: true } }),
        prisma.location.count({ where: { status: 'LIVE' } }),
        prisma.location.count({ where: { status: 'PLANNED' } }),
        prisma.location.count({ where: { status: 'UNDER_CONSTRUCTION' } }),
        prisma.location.aggregate({ _sum: { chargerCount: true } }),
        prisma.amenity.count({ where: { active: true } }),
        prisma.amenity.count(),
        prisma.locationAmenity.count(),
        prisma.location.count({ where: { pricePerKwh: null } }),
        prisma.posts.count(),
        prisma.posts.count({ where: { status: 'Published' } }),
    ]);

    return {
        locationsTotal,
        locationsPublished,
        locationsHidden: locationsTotal - locationsPublished,
        open,
        comingSoon,
        underConstruction,
        chargingBays: bays._sum.chargerCount ?? 0,
        amenitiesActive,
        amenitiesTotal,
        amenitiesAssigned,
        withoutPrice,
        articlesTotal,
        articlesPublished,
    };
}
