'use server';

import { LOCATIONS_TAG } from '@/lib/locations/server';
import { Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { amenitySchema } from '@/lib/validations/location';
import { Prisma } from '@prisma/client';
import { updateTag } from 'next/cache';
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';

/**
 * The amenity catalogue, managed from the dashboard.
 *
 * Writes only; the read is a cached one in lib/locations/dashboard.ts. Every write
 * invalidates the same tag the locations do, because the public finder reads both
 * through one cached path: renaming an amenity has to reach the filter tray as surely
 * as adding a site reaches the map.
 */

export async function createAmenity(raw: unknown) {
    const session = await requirePermission(Permission.MANAGE_AMENITIES);
    if (!session) return UNAUTHORIZED;

    const parsed = amenitySchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }

    try {
        const amenity = await prisma.amenity.create({
            data: parsed.data,
            select: { id: true },
        });
        updateTag(LOCATIONS_TAG);
        return { success: true as const, id: amenity.id };
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            return { success: false as const, error: 'That slug is already in use.' };
        }
        console.error('Create Amenity Error:', error);
        return { success: false as const, error: 'Failed to create the amenity.' };
    }
}

/**
 * Updates one entry.
 *
 * The slug is editable, and changing it is a real consequence rather than a rename: it is
 * the value in ?amenities= on a shared link, so an old link stops matching. The dashboard
 * says so beside the field.
 */
export async function updateAmenity(id: string, raw: unknown) {
    const session = await requirePermission(Permission.MANAGE_AMENITIES);
    if (!session) return UNAUTHORIZED;

    const parsed = amenitySchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }

    try {
        await prisma.amenity.update({ where: { id }, data: parsed.data });
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { success: false as const, error: 'That slug is already in use.' };
            }
            if (error.code === 'P2025') {
                return { success: false as const, error: 'That amenity no longer exists.' };
            }
        }
        console.error('Update Amenity Error:', error);
        return { success: false as const, error: 'Failed to save the amenity.' };
    }
}

/**
 * The enable/disable switch the client asked for.
 *
 * Turning one off hides it from the filter and from every station card without touching a
 * single assignment, so turning it back on restores exactly what was there. That is why
 * this exists as well as delete, which does not.
 */
export async function setAmenityActive(id: string, active: boolean) {
    const session = await requirePermission(Permission.MANAGE_AMENITIES);
    if (!session) return UNAUTHORIZED;

    try {
        await prisma.amenity.update({ where: { id }, data: { active } });
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        console.error('Toggle Amenity Error:', error);
        return { success: false as const, error: 'Failed to change the amenity.' };
    }
}

/** Persists a drag reorder as one transaction, so a half applied order is impossible. */
export async function reorderAmenities(ids: string[]) {
    const session = await requirePermission(Permission.MANAGE_AMENITIES);
    if (!session) return UNAUTHORIZED;

    if (ids.length === 0) return { success: true as const };
    if (new Set(ids).size !== ids.length) {
        return { success: false as const, error: 'The new order repeats an amenity.' };
    }

    try {
        await prisma.$transaction(
            ids.map((id, index) =>
                prisma.amenity.update({
                    where: { id },
                    data: { sortOrder: (index + 1) * 10 },
                })
            )
        );
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        console.error('Reorder Amenities Error:', error);
        return { success: false as const, error: 'Failed to save the new order.' };
    }
}

/**
 * Removes an entry from the catalogue for good.
 *
 * The assignments go with it by cascade and do not come back, which is why the UI shows
 * how many sites are about to lose it and offers the active switch as the reversible
 * alternative.
 */
export async function deleteAmenity(id: string) {
    const session = await requirePermission(Permission.MANAGE_AMENITIES);
    if (!session) return UNAUTHORIZED;

    try {
        await prisma.amenity.delete({ where: { id } });
        updateTag(LOCATIONS_TAG);
        return { success: true as const };
    } catch (error) {
        console.error('Delete Amenity Error:', error);
        return { success: false as const, error: 'Failed to delete the amenity.' };
    }
}
