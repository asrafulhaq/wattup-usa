'use server';

import prisma from '@/lib/prisma';
import { Permission } from '@/lib/permissions';
import { locationSchema, slugify, type LocationInput } from '@/lib/validations/location';
import { LOCATIONS_TAG } from '@/lib/locations/server';
import { Prisma } from '@prisma/client';
import { updateTag } from 'next/cache';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';

/**
 * Dashboard writes for the charging network.
 *
 * Writes only. Everything exported from a 'use server' module is a callable endpoint, so
 * the reads live in lib/locations/dashboard.ts, where they are also cached: a server
 * action cannot be, and every dashboard navigation was re-querying because of it.
 *
 * Each mutation ends with updateTag(LOCATIONS_TAG), which invalidates both the public
 * finder and those cached dashboard reads, so an edit shows up immediately on both.
 */

/**
 * Turns validated input into the column writes, minus the two relations.
 *
 * Every field is listed rather than spread, so a field added to the schema has to be
 * added here consciously and cannot arrive at the database by accident.
 */
function toColumns(input: LocationInput) {
    return {
        slug: input.slug,
        name: input.name,
        street: input.street,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
        market: input.market,
        status: input.status,
        goLiveYear: input.goLiveYear,
        county: input.county,
        countyFips: input.countyFips,
        maxPowerKw: input.maxPowerKw,
        chargerCount: input.chargerCount,
        pricePerKwh:
            input.pricePerKwh === null
                ? null
                : new Prisma.Decimal(input.pricePerKwh.toFixed(4)),
        published: input.published,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        imageUrl: input.imageUrl,
        imagePublicId: input.imagePublicId,
        noIndex: input.noIndex,
        signedNumber: input.signedNumber,
        initialNotes: input.initialNotes,
        pipelineRef: input.pipelineRef,
        company: input.company,
        addressRaw: input.addressRaw,
        noticeAddress: input.noticeAddress,
        apn: input.apn,
        siteScore: input.siteScore,
        switchgearCount: input.switchgearCount,
        switchgearOrderedDate: input.switchgearOrderedDate,
        salesRep: input.salesRep,
    };
}

/**
 * Resolves amenity slugs to row ids, rejecting any that do not exist.
 *
 * Rejecting rather than silently dropping: a slug that does not resolve means the form
 * and the catalogue disagree, and quietly saving fewer amenities than the person ticked
 * is the kind of bug nobody reports because nobody notices.
 */
async function resolveAmenityIds(slugs: string[]) {
    const unique = [...new Set(slugs)];
    if (unique.length === 0) return { ids: [] as string[], missing: [] as string[] };

    const rows = await prisma.amenity.findMany({
        where: { slug: { in: unique } },
        select: { id: true, slug: true },
    });

    const found = new Set(rows.map(row => row.slug));
    return {
        ids: rows.map(row => row.id),
        missing: unique.filter(slug => !found.has(slug)),
    };
}

/** A connector row is only worth storing when there is at least one of that type. */
function connectorRows(input: LocationInput) {
    return input.connectors
        .filter(connector => connector.count > 0)
        .map(connector => ({ type: connector.type, count: connector.count }));
}

export async function createLocation(raw: unknown) {
    const session = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    const parsed = locationSchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    const input = parsed.data;

    const { ids, missing } = await resolveAmenityIds(input.amenities);
    if (missing.length > 0) {
        return {
            success: false as const,
            error: `Unknown amenity: ${missing.join(', ')}. Reload the page and try again.`,
        };
    }

    try {
        const location = await prisma.location.create({
            data: {
                ...toColumns(input),
                amenities: { create: ids.map(amenityId => ({ amenityId })) },
                connectors: { create: connectorRows(input) },
            },
            select: { id: true },
        });

        updateTag(LOCATIONS_TAG);
        return { success: true as const, id: location.id };
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            return {
                success: false as const,
                error: 'A location with that URL slug already exists.',
            };
        }
        console.error('Create Location Error:', error);
        return { success: false as const, error: 'Failed to create the location.' };
    }
}

export async function updateLocation(id: string, raw: unknown) {
    const session = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    const parsed = locationSchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    const input = parsed.data;

    const { ids, missing } = await resolveAmenityIds(input.amenities);
    if (missing.length > 0) {
        return {
            success: false as const,
            error: `Unknown amenity: ${missing.join(', ')}. Reload the page and try again.`,
        };
    }

    try {
        // Both relations are replaced wholesale inside one transaction. Diffing them
        // would be more code for the same result on a set this small, and a half applied
        // change is the one outcome that must not be possible.
        await prisma.$transaction([
            prisma.locationAmenity.deleteMany({ where: { locationId: id } }),
            prisma.locationConnector.deleteMany({ where: { locationId: id } }),
            prisma.location.update({
                where: { id },
                data: {
                    ...toColumns(input),
                    amenities: { create: ids.map(amenityId => ({ amenityId })) },
                    connectors: { create: connectorRows(input) },
                },
            }),
        ]);

        updateTag(LOCATIONS_TAG);
        return { success: true as const, id };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    success: false as const,
                    error: 'A location with that URL slug already exists.',
                };
            }
            if (error.code === 'P2025') {
                return { success: false as const, error: 'That location no longer exists.' };
            }
        }
        console.error('Update Location Error:', error);
        return { success: false as const, error: 'Failed to save the location.' };
    }
}

export async function setLocationPublished(id: string, published: boolean) {
    const session = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    try {
        await prisma.location.update({ where: { id }, data: { published } });
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        console.error('Publish Location Error:', error);
        return { success: false as const, error: 'Failed to change visibility.' };
    }
}

/**
 * Deletes a site.
 *
 * A separate permission from editing. Unpublishing covers "take it off the site", which
 * is the reversible thing people usually mean, and the assignments and connector rows go
 * with a deletion by cascade and do not come back.
 */
export async function deleteLocation(id: string) {
    const session = await requirePermission(Permission.DELETE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    try {
        await prisma.location.delete({ where: { id } });
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        console.error('Delete Location Error:', error);
        return { success: false as const, error: 'Failed to delete the location.' };
    }
}

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    label: string;
}

/**
 * Resolves a typed address to coordinates, for the form's "Locate" button.
 *
 * Returns a candidate rather than writing it: the seeded coordinates are postcode
 * approximations, and swapping one silently for a geocoder's guess is how a pin ends up
 * on the wrong side of a motorway with nobody having agreed to it. The form shows the
 * result and the person applies it.
 *
 * The token is read here rather than being passed in, so this endpoint cannot be used to
 * geocode through someone else's key.
 */
export async function geocodeLocationAddress(
    address: string
): Promise<{ success: true; result: GeocodeResult } | { success: false; error: string }> {
    const session = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    const query = address.trim();
    if (query.length < 5) {
        return { success: false, error: 'Enter more of the address first.' };
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
    if (!token) {
        return { success: false, error: 'No Mapbox token is configured on the server.' };
    }

    try {
        const params = new URLSearchParams({
            q: query,
            access_token: token,
            limit: '1',
            types: 'address,street,postcode,place',
        });
        const response = await fetch(
            `https://api.mapbox.com/search/geocode/v6/forward?${params}`,
            { cache: 'no-store' }
        );
        if (!response.ok) {
            return { success: false, error: `Geocoding failed (${response.status}).` };
        }

        const body = await response.json();
        const feature = body?.features?.[0]?.properties;
        const coordinates = feature?.coordinates;
        if (!coordinates) {
            return { success: false, error: 'No match for that address.' };
        }

        return {
            success: true,
            result: {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                label: feature.full_address ?? feature.name ?? query,
            },
        };
    } catch (error) {
        console.error('Geocode Location Error:', error);
        return { success: false, error: 'Could not reach the geocoder.' };
    }
}

/** Offered by the form so a name does not have to be slugified by hand. */
export async function suggestLocationSlug(name: string, city: string) {
    const session = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;

    const base = slugify([city, name].filter(Boolean).join(' ')) || 'location';

    // Walks up rather than trusting the first guess: the unique constraint would reject
    // a duplicate anyway, and a suggestion that is going to be rejected is not a
    // suggestion.
    const taken = new Set(
        (
            await prisma.location.findMany({
                where: { slug: { startsWith: base } },
                select: { slug: true },
            })
        ).map(row => row.slug)
    );

    if (!taken.has(base)) return { success: true as const, slug: base };

    for (let n = 2; n < 100; n += 1) {
        const candidate = `${base}-${n}`;
        if (!taken.has(candidate)) return { success: true as const, slug: candidate };
    }
    return { success: true as const, slug: `${base}-${Date.now()}` };
}
