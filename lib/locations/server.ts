import 'server-only';

import prisma from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';
import type { AmenityOption } from './amenities';
import { toPublicStation } from './public';
import type {
  ConnectorType,
  PublicStation,
  StationConnector,
  StationRecord,
  StationStatus,
} from './types';

/**
 * Server side reads of the location records.
 *
 * The database is the source of truth. Everything a visitor sees comes through here,
 * and what of a row is allowed to leave is still decided in ./public, in one place, so
 * widening it stays a single deliberate edit rather than an audit of every component.
 *
 * The `server-only` import makes a mistake a build error rather than a leak: any module
 * reachable from a "use client" boundary that imports this file fails to compile.
 */

/** The cache tag every location write invalidates. See app/_actions/locationActions.ts. */
export const LOCATIONS_TAG = 'locations';

/**
 * Rows are read whole, joins included. Twenty-seven sites with at most fifteen amenity
 * rows and four connector rows each is a few hundred rows in total: one query with two
 * joins, cached, is cheaper than any pagination we could add.
 */
const LOCATION_INCLUDE = {
  amenities: {
    include: {
      amenity: { select: { slug: true, active: true, sortOrder: true } },
    },
  },
  connectors: { select: { type: true, count: true } },
} as const;

type LocationRow = Awaited<
  ReturnType<typeof prisma.location.findFirstOrThrow<{ include: typeof LOCATION_INCLUDE }>>
>;

/**
 * A row, mapped back to the record shape the rest of the code already speaks.
 *
 * Keeping StationRecord means the projection in ./public and the script that proves it
 * did not have to change when the source of the data did.
 */
function toStationRecord(row: LocationRow): StationRecord {
  return {
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
    status: row.status as StationStatus,
    goLiveYear: row.goLiveYear,
    county: row.county,
    countyFips: row.countyFips,
    maxPowerKw: row.maxPowerKw,
    // Slugs, not row ids. These end up in the URL as ?amenities=restrooms,food, and a
    // slug survives a reseed into a fresh database where a cuid would not.
    //
    // An amenity switched off in the catalogue is dropped here rather than unassigned,
    // so it vanishes from the filter and the cards while the assignment survives:
    // switching it back on restores exactly what was there before.
    amenities: row.amenities
      .filter((link) => link.amenity.active)
      .sort((a, b) => a.amenity.sortOrder - b.amenity.sortOrder)
      .map((link) => link.amenity.slug),
    // Decimal, because a tariff is money. Number() at the boundary rather than deeper
    // in: nothing downstream should have to know the column type.
    pricePerKwh: row.pricePerKwh === null ? null : Number(row.pricePerKwh),
    connectors: row.connectors.map(
      (connector): StationConnector => ({
        type: connector.type as ConnectorType,
        count: connector.count,
      }),
    ),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    imageUrl: row.imageUrl,
    noIndex: row.noIndex,
    updatedAt: row.updatedAt.toISOString(),
    signedNumber: row.signedNumber,
    initialNotes: row.initialNotes,
    pipelineRef: row.pipelineRef,
    company: row.company,
    addressRaw: row.addressRaw,
    noticeAddress: row.noticeAddress,
    apn: row.apn,
    siteScore: row.siteScore,
    chargerCount: row.chargerCount,
    switchgearCount: row.switchgearCount,
    switchgearOrderedDate: row.switchgearOrderedDate,
    salesRep: row.salesRep,
  };
}

/**
 * Every published site, both install years, in the shape the browser may see.
 *
 * Unpublished sites are excluded here rather than filtered by the caller, so a site
 * hidden in the dashboard cannot reappear because one page forgot the condition.
 */
export async function getPublicStations(): Promise<PublicStation[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(LOCATIONS_TAG);

  const rows = await prisma.location.findMany({
    where: { published: true },
    include: LOCATION_INCLUDE,
    orderBy: [{ goLiveYear: 'asc' }, { city: 'asc' }],
  });

  return rows.map((row) => toPublicStation(toStationRecord(row)));
}

/**
 * The amenity catalogue, active entries only, in the order the dashboard set.
 *
 * Read here and passed into the client island as a prop rather than imported from code,
 * because the client owns the labels now: renaming "Wi-Fi" in the dashboard has to
 * change what the filter tray says without a deploy. The icon is a registry key, not a
 * component, so this crosses the boundary as plain data.
 */
export async function getAmenityCatalogue(): Promise<AmenityOption[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(LOCATIONS_TAG);

  const rows = await prisma.amenity.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { slug: true, label: true, icon: true },
  });

  return rows.map((row) => ({ id: row.slug, label: row.label, icon: row.icon }));
}

/**
 * The Mapbox public token.
 *
 * Stored as MAPBOX_ACCESS_TOKEN rather than NEXT_PUBLIC_MAPBOX_TOKEN, so Next does not
 * inline it into every client bundle. It is read here and handed to the map island as a
 * prop, which means it still reaches the browser, because Mapbox GL cannot fetch tiles
 * without it. That is unavoidable and by design for a pk token: the protection is the
 * URL restriction list on the token itself, not secrecy.
 */
export function getMapboxToken(): string | null {
  return process.env.MAPBOX_ACCESS_TOKEN?.trim() || null;
}
