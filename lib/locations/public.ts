import type { PublicStation, StationRecord, StationStatus } from "./types";

/**
 * The single place that decides what leaves the server.
 *
 * Everything from the sheet is kept in ./data. This module is the only route from that
 * record to the browser, so widening or narrowing what visitors see is one edit here
 * rather than an audit of every component.
 *
 * Nothing here imports ./data. That module is server only, and these helpers are needed
 * inside client components, so pulling it in would drag private data across the
 * boundary and fail the build. Reading the records lives in ./server.
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
 *   imagePublicId         Cloudinary handle, only needed server side to delete an image
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
    county: record.county,
    countyFips: record.countyFips,
    maxPowerKw: record.maxPowerKw,
    amenities: record.amenities,
    pricePerKwh: record.pricePerKwh,
    connectors: record.connectors,
    chargerCount: record.chargerCount,
    metaTitle: record.metaTitle,
    metaDescription: record.metaDescription,
    imageUrl: record.imageUrl,
    noIndex: record.noIndex,
    updatedAt: record.updatedAt,
  };
}

/**
 * What the status chip reads.
 *
 * Driven by status rather than by the install year. A year is a project milestone; a
 * visitor only wants to know whether they can charge there.
 *
 * Split in two so the dashboard, which holds a bare status rather than a whole station,
 * says exactly what the public site says rather than keeping its own wording.
 */
export function statusLabelFor(status: StationStatus): string {
  if (status === "LIVE") return "Open";
  if (status === "UNDER_CONSTRUCTION") return "Under construction";
  return "Coming soon";
}

export function statusLabel(station: PublicStation): string {
  return statusLabelFor(station.status);
}

export function formatAddress(station: PublicStation): string {
  return `${station.street}, ${station.city}, ${station.region} ${station.postalCode}`;
}

/** "$0.39/kWh plus tax", or null when no tariff has been set for the site. */
export function formatPrice(station: PublicStation): string | null {
  if (station.pricePerKwh === null) return null;
  return `$${station.pricePerKwh.toFixed(2)}/kWh plus tax`;
}

/** "6 CCS1 · 4 NACS", or null when the build has not been specified. */
export function formatConnectors(station: PublicStation): string | null {
  if (station.connectors.length === 0) return null;
  return station.connectors
    .map((connector) => `${connector.count} ${connector.type}`)
    .join(" \u00b7 ");
}

/**
 * The generated page title and description.
 *
 * Shared by the station page's generateMetadata and by the dashboard's search preview.
 * If the dashboard built its own version, the preview would show one thing and Google
 * another, and the person editing would have no way to know which was real.
 *
 * Structural input rather than PublicStation, so the dashboard form can pass what it is
 * holding mid-edit without first constructing a whole station.
 */
export interface StationMetaInput {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  maxPowerKw: number;
  chargerCount: number;
  status: StationStatus;
}

export function defaultMetaTitle(station: StationMetaInput): string {
  return `EV Charging on ${station.street}, ${station.city} | WattUp USA`;
}

export function defaultMetaDescription(station: StationMetaInput): string {
  const address = `${station.street}, ${station.city}, ${station.region} ${station.postalCode}`;
  const bays = station.chargerCount === 1 ? "charger" : "chargers";
  return `${station.maxPowerKw}kW ultra fast EV charging with ${station.chargerCount} ${bays} at ${address}. ${statusLabelFor(station.status)}.`;
}

/** The override when there is one, otherwise the generated value. */
export function metaTitleFor(
  station: StationMetaInput & { metaTitle?: string | null },
): string {
  return station.metaTitle?.trim() || defaultMetaTitle(station);
}

export function metaDescriptionFor(
  station: StationMetaInput & { metaDescription?: string | null },
): string {
  return station.metaDescription?.trim() || defaultMetaDescription(station);
}
