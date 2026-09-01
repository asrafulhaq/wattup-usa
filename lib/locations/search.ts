import type { PublicStation } from "./types";

export interface SearchPoint {
  latitude: number;
  longitude: number;
  label: string;
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Resolves a typed query to a point on the map.
 *
 * There is no geocoder wired up, so this matches against the cities, postcodes and site
 * names we already hold. That covers the queries this section realistically receives
 * ("Redlands", "92374", "San Diego"). An arbitrary street address returns null and the
 * caller falls back to free text filtering. When a geocoder is added it slots in as
 * another resolver behind this same signature.
 */
export function resolveSearchPoint(
  query: string,
  stations: PublicStation[],
): SearchPoint | null {
  const q = normalise(query);
  if (!q) return null;

  const exactPostcode = stations.find((s) => s.postalCode === q);
  if (exactPostcode) {
    return {
      latitude: exactPostcode.latitude,
      longitude: exactPostcode.longitude,
      label: `${exactPostcode.city} ${exactPostcode.postalCode}`,
    };
  }

  // A city can hold several sites; centre on their mean so none sits off screen.
  const inCity = stations.filter((s) => normalise(s.city) === q);
  if (inCity.length > 0) {
    return {
      latitude: inCity.reduce((n, s) => n + s.latitude, 0) / inCity.length,
      longitude: inCity.reduce((n, s) => n + s.longitude, 0) / inCity.length,
      label: `${inCity[0].city}, ${inCity[0].region}`,
    };
  }

  const partial = stations.find(
    (s) => normalise(s.city).startsWith(q) || normalise(s.name).includes(q),
  );
  if (partial) {
    return {
      latitude: partial.latitude,
      longitude: partial.longitude,
      label: `${partial.city}, ${partial.region}`,
    };
  }

  return null;
}

/** Free text filter, used when a query does not resolve to a single point. */
export function matchesQuery(station: PublicStation, query: string): boolean {
  const q = normalise(query);
  if (!q) return true;
  return normalise(
    `${station.name} ${station.street} ${station.city} ${station.region} ${station.postalCode}`,
  ).includes(q);
}
