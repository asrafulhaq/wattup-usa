/**
 * No site is live yet: all 27 are signed and in build. The map must say so, or a driver
 * taps a pin and drives to a construction site.
 */
import type { AmenityId } from "./amenities";

export type StationStatus = "LIVE" | "UNDER_CONSTRUCTION" | "PLANNED";

export type ConnectorType = "CCS1" | "NACS" | "CCS2" | "CHAdeMO";

export interface StationConnector {
  type: ConnectorType;
  count: number;
}

/** Sites are funded per install year. Both years are in the data, told apart by this. */
export type GoLiveYear = 2026 | 2027;

/**
 * Every column of the signed-locations sheet, plus what we derive from it.
 *
 * SERVER ONLY. `company`, `noticeAddress`, `apn`, `siteScore` and `salesRep` are
 * private; several notice addresses are residential. Use PublicStation in anything the
 * browser loads.
 */
export interface StationRecord {
  // derived
  slug: string;
  /** Public site name, not the owner entity. */
  name: string;
  street: string;
  city: string;
  /** State for US sites, region elsewhere. */
  region: string;
  postalCode: string;
  /** ISO-3166 alpha-2. */
  country: string;
  latitude: number;
  longitude: number;
  /** Market registry key, so Singapore is rows rather than a refactor. */
  market: string;
  status: StationStatus;
  goLiveYear: GoLiveYear;
  /** County the site falls in, resolved against the basemap at generation time. */
  county: string;
  countyFips: string;
  /** Peak charging speed in kW. 310 across the network, per the client's spec. */
  maxPowerKw: number;
  /** Amenities present on site. Assigned in the dashboard, empty until surveyed. */
  amenities: AmenityId[];
  /**
   * Price per kWh in USD, before tax. Null until a tariff is set.
   *
   * A static figure held per site, not a live rate. The reference network shows a price
   * with "updated a minute ago" because it reads a live feed from commissioned hardware;
   * ours has no hardware energised yet, so a number here would be a quote, and one that
   * cannot be stale is better than one that pretends to be current.
   */
  pricePerKwh: number | null;
  /** Connector types and counts. Empty until the build is specified per site. */
  connectors: StationConnector[];

  // straight from the sheet
  signedNumber: number | null;
  initialNotes: string;
  pipelineRef: string;
  /** Property owner's legal entity. Private. */
  company: string;
  /** The address exactly as the sheet writes it, before parsing. */
  addressRaw: string;
  /** Owner's address for legal notices. Private, and often a home. */
  noticeAddress: string;
  /** Assessor's parcel number. Private. */
  apn: string;
  /** Internal site score out of 5. Not a customer review. Private. */
  siteScore: number | null;
  chargerCount: number;
  switchgearCount: number | null;
  switchgearOrderedDate: string | null;
  /** Private. */
  salesRep: string;
}

/**
 * The subset that reaches the browser. Composed in ./public, which is the one place
 * that decision is made.
 */
export type PublicStation = Pick<
  StationRecord,
  | "slug"
  | "name"
  | "street"
  | "city"
  | "region"
  | "postalCode"
  | "country"
  | "latitude"
  | "longitude"
  | "market"
  | "status"
  | "goLiveYear"
  | "county"
  | "countyFips"
  | "maxPowerKw"
  | "amenities"
  | "pricePerKwh"
  | "connectors"
  | "chargerCount"
>;

/** A station with its distance from the active search point, in miles. */
export interface RankedStation extends PublicStation {
  distance: number | null;
}
