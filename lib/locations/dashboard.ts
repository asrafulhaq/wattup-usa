import 'server-only';

import { sessionWith } from '@/app/_actions/permission-guard';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';
import { LOCATIONS_TAG } from './server';
import type { LocationInput } from '@/lib/validations/location';

/**
 * Dashboard reads.
 *
 * Split from app/_actions/locationActions.ts for two reasons. Everything exported from a
 * 'use server' module becomes a callable endpoint, and a list of owner entities and
 * notice addresses does not need to be one when only server components read it. And a
 * server action cannot be cached, so every navigation re-queried, which is what made
 * moving between dashboard screens feel slow.
 *
 * The shape here is: an uncached wrapper does the permission check, because that reads
 * headers and a cached scope may not; the reader underneath is cached and tagged, and
 * every mutation in the actions file calls updateTag(LOCATIONS_TAG), so an edit is
 * visible immediately and an unchanged screen costs no query.
 */

const LOCATION_INCLUDE = {
    amenities: { select: { amenity: { select: { slug: true } } } },
    connectors: { select: { type: true, count: true } },
} as const;

export interface DashboardLocation {
    id: string;
    slug: string;
    name: string;
    city: string;
    region: string;
    status: string;
    goLiveYear: number;
    chargerCount: number;
    maxPowerKw: number;
    published: boolean;
    amenityCount: number;
    pricePerKwh: number | null;
    updatedAt: string;
}

export interface DashboardAmenity {
    id: string;
    slug: string;
    label: string;
    icon: string;
    sortOrder: number;
    active: boolean;
    /** How many sites have it. Shown before deleting, since that cascade is silent. */
    locationCount: number;
}

// ── Cached readers ───────────────────────────────────────────────────────────

async function readDashboardLocations(): Promise<DashboardLocation[]> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG);

    const rows = await prisma.location.findMany({
        orderBy: [{ goLiveYear: 'asc' }, { city: 'asc' }],
        select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            region: true,
            status: true,
            goLiveYear: true,
            chargerCount: true,
            maxPowerKw: true,
            published: true,
            pricePerKwh: true,
            updatedAt: true,
            _count: { select: { amenities: true } },
        },
    });

    return rows.map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        city: row.city,
        region: row.region,
        status: row.status,
        goLiveYear: row.goLiveYear,
        chargerCount: row.chargerCount,
        maxPowerKw: row.maxPowerKw,
        published: row.published,
        amenityCount: row._count.amenities,
        pricePerKwh: row.pricePerKwh === null ? null : Number(row.pricePerKwh),
        updatedAt: row.updatedAt.toISOString(),
    }));
}

async function readDashboardAmenities(): Promise<DashboardAmenity[]> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG);

    const rows = await prisma.amenity.findMany({
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        select: {
            id: true,
            slug: true,
            label: true,
            icon: true,
            sortOrder: true,
            active: true,
            _count: { select: { locations: true } },
        },
    });

    return rows.map(row => ({
        id: row.id,
        slug: row.slug,
        label: row.label,
        icon: row.icon,
        sortOrder: row.sortOrder,
        active: row.active,
        locationCount: row._count.locations,
    }));
}

async function readLocationForEdit(
    id: string
): Promise<(LocationInput & { id: string }) | null> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG);

    const row = await prisma.location.findUnique({
        where: { id },
        include: LOCATION_INCLUDE,
    });
    if (!row) return null;

    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        street: row.street,
        city: row.city,
        region: row.region,
        postalCode: row.postalCode,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        market: row.market,
        status: row.status,
        goLiveYear: row.goLiveYear,
        county: row.county,
        countyFips: row.countyFips,
        maxPowerKw: row.maxPowerKw,
        chargerCount: row.chargerCount,
        pricePerKwh: row.pricePerKwh === null ? null : Number(row.pricePerKwh),
        published: row.published,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        imageUrl: row.imageUrl,
        imagePublicId: row.imagePublicId,
        noIndex: row.noIndex,
        amenities: row.amenities.map(link => link.amenity.slug),
        connectors: row.connectors.map(connector => ({
            type: connector.type,
            count: connector.count,
        })),
        signedNumber: row.signedNumber,
        initialNotes: row.initialNotes,
        pipelineRef: row.pipelineRef,
        company: row.company,
        addressRaw: row.addressRaw,
        noticeAddress: row.noticeAddress,
        apn: row.apn,
        siteScore: row.siteScore,
        switchgearCount: row.switchgearCount,
        switchgearOrderedDate: row.switchgearOrderedDate,
        salesRep: row.salesRep,
    };
}

// ── Permission checked entry points ──────────────────────────────────────────

/** The list behind /dashboard/locations. Empty for a caller without the permission. */
export async function getDashboardLocations(): Promise<DashboardLocation[]> {
    const session = await sessionWith(Permission.MANAGE_LOCATIONS);
    if (!session) return [];
    return readDashboardLocations();
}

/** The whole catalogue, inactive entries included. The public read filters those out. */
export async function getDashboardAmenities(): Promise<DashboardAmenity[]> {
    const session = await sessionWith(Permission.MANAGE_LOCATIONS);
    if (!session) return [];
    return readDashboardAmenities();
}

/**
 * One location in the shape the form edits, private columns included.
 *
 * Permission checked like every other read here: this returns the owner's legal entity
 * and their notice address, several of which are private homes.
 */
export async function getLocationForEdit(id: string) {
    const session = await sessionWith(Permission.MANAGE_LOCATIONS);
    if (!session) return null;
    return readLocationForEdit(id);
}
