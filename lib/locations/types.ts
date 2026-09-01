/**
 * No site is live yet: all 27 are signed and in build. The map must say so, or a driver
 * taps a pin and drives to a construction site.
 */
export type StationStatus = "LIVE" | "UNDER_CONSTRUCTION" | "PLANNED";

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
  | "chargerCount"
>;

/** A station with its distance from the active search point, in miles. */
export interface RankedStation extends PublicStation {
  distance: number | null;
}
