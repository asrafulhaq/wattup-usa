export type StationStatus = "LIVE" | "UNDER_CONSTRUCTION" | "PLANNED";

export interface StationLocation {
  slug: string;
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
  goLiveYear: number;
  chargerCount: number;
}

/** A station with its distance from the active search point, in the market's unit. */
export interface RankedStation extends StationLocation {
  distance: number | null;
}
