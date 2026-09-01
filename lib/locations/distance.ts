const EARTH_RADIUS_MILES = 3958.8;
const MILES_PER_KM = 0.621371;

export type DistanceUnit = "mi" | "km";

/** Great circle distance in miles. */
export function haversineMiles(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Converts miles into the market's unit. Distance is stored in miles throughout and
 * converted only for display, so Singapore is a formatting change rather than a second
 * code path.
 */
export function toUnit(miles: number, unit: DistanceUnit): number {
  return unit === "km" ? miles / MILES_PER_KM : miles;
}

export function formatDistance(miles: number, unit: DistanceUnit): string {
  const value = toUnit(miles, unit);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit}`;
}
