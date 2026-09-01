import { haversineMiles } from "./distance";
import { matchesQuery } from "./search";
import type { SearchPoint } from "./search";
import type { PublicStation, RankedStation } from "./types";

export interface StationFilters {
  /** Free text, applied when it does not resolve to a point. */
  query: string;
  /** Resolved search origin, from geocoding or the browser. */
  near: SearchPoint | null;
  /** Radius in miles. Null means no distance limit. */
  radius: number | null;
  /** Install years to include. Empty means all. */
  years: number[];
  /** Minimum chargers on site. */
  minChargers: number;
}

export const DEFAULT_FILTERS: StationFilters = {
  query: "",
  near: null,
  radius: null,
  years: [],
  minChargers: 0,
};

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

/**
 * Applies every filter and ranks the result.
 *
 * All of this runs against data already in memory, so it costs no request and resolves
 * well inside a frame. Even at 500 sites the whole set is smaller than one hero image.
 */
export function applyFilters(
  stations: PublicStation[],
  filters: StationFilters,
): RankedStation[] {
  const { near, radius, years, minChargers, query } = filters;

  return stations
    .map((station) => ({
      ...station,
      distance: near
        ? haversineMiles(near.latitude, near.longitude, station.latitude, station.longitude)
        : null,
    }))
    .filter((station) => {
      if (years.length > 0 && !years.includes(station.goLiveYear)) return false;
      if (station.chargerCount < minChargers) return false;
      if (radius !== null && station.distance !== null && station.distance > radius) {
        return false;
      }
      // Free text only narrows when there is no resolved point; once we have
      // coordinates the distance sort is the better answer.
      if (!near && !matchesQuery(station, query)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.goLiveYear !== b.goLiveYear) return a.goLiveYear - b.goLiveYear;
      return a.city.localeCompare(b.city);
    });
}

/** How many sites a single filter would leave, used for the counts beside each option. */
export function countWith(
  stations: PublicStation[],
  filters: StationFilters,
  override: Partial<StationFilters>,
): number {
  return applyFilters(stations, { ...filters, ...override }).length;
}

export function activeFilterCount(filters: StationFilters): number {
  let n = 0;
  if (filters.years.length > 0) n += 1;
  if (filters.minChargers > 0) n += 1;
  if (filters.radius !== null) n += 1;
  return n;
}
