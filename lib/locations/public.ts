import { STATIONS } from "./data";
import type { GoLiveYear, PublicStation, StationRecord } from "./types";

/**
 * The single place that decides what leaves the server.
 *
 * Everything from the sheet is kept in ./data. This module is the only route from that
 * record to the browser, so widening or narrowing what visitors see is one edit here
 * rather than an audit of every component.
 *
 * Deliberately excluded, pending a decision:
 *   company               owner's legal entity
 *   noticeAddress         owner's legal notice address, several are private homes
 *   apn                   assessor's parcel number
 *   siteScore             internal score out of 5, reads as a customer review if shown
 *   salesRep              internal
 *   initialNotes          internal deal notes
 *   pipelineRef           internal
 *   signedNumber          internal
 *   switchgearCount       operational detail, means nothing to a driver
 *   switchgearOrderedDate superseded by goLiveYear
 *   addressRaw            unparsed duplicate of street/city/postalCode
 */
export function toPublicStation(record: StationRecord): PublicStation {
  return {
    slug: record.slug,
    name: record.name,
    street: record.street,
    city: record.city,
    region: record.region,
    postalCode: record.postalCode,
    country: record.country,
    latitude: record.latitude,
    longitude: record.longitude,
    market: record.market,
    status: record.status,
    goLiveYear: record.goLiveYear,
    chargerCount: record.chargerCount,
  };
}

/** Every signed site, both install years, in the shape the browser may see. */
export function getPublicStations(): PublicStation[] {
  return STATIONS.map(toPublicStation);
}

/**
 * What the status chip reads. No site is live, so the year carries the meaning: a
 * visitor should never think a 2027 site is somewhere they can charge today.
 */
export function statusLabel(station: PublicStation): string {
  if (station.status === "LIVE") return "Open now";
  if (station.status === "UNDER_CONSTRUCTION") return "Under construction";
  return `Coming ${station.goLiveYear}`;
}

export function stationsByYear(
  stations: PublicStation[],
): Record<GoLiveYear, PublicStation[]> {
  return {
    2026: stations.filter((s) => s.goLiveYear === 2026),
    2027: stations.filter((s) => s.goLiveYear === 2027),
  };
}
