import type { SearchPoint } from "./search";

/** Mapbox Geocoding v6 forward search, scoped to the market. */
const ENDPOINT = "https://api.mapbox.com/search/geocode/v6/forward";

/** Feature types worth returning for a charger search. */
const TYPES = ["address", "street", "postcode", "place", "locality", "neighborhood"];

interface GeocodeOptions {
  token: string;
  /** Bias results toward the map's centre so "Main St" resolves nearby. */
  proximity?: { latitude: number; longitude: number };
  country?: string;
  signal?: AbortSignal;
}

interface MapboxFeature {
  properties?: {
    full_address?: string;
    name?: string;
    place_formatted?: string;
    coordinates?: { latitude: number; longitude: number };
  };
}

/**
 * Resolves free text to candidate points.
 *
 * Local matching in ./search covers the cities and postcodes we hold, and is instant
 * because the data is already in memory. This covers everything else: a street address,
 * a landmark, a postcode we have no site in. Callers should try local first and fall
 * back here, so the common case costs no request.
 */
export async function geocode(
  query: string,
  { token, proximity, country = "us", signal }: GeocodeOptions,
): Promise<SearchPoint[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    access_token: token,
    country,
    limit: "5",
    types: TYPES.join(","),
  });
  if (proximity) {
    params.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Geocoding failed with ${response.status}`);
  }

  const body: { features?: MapboxFeature[] } = await response.json();
  return (body.features ?? []).flatMap((feature) => {
    const coords = feature.properties?.coordinates;
    if (!coords) return [];
    return [
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        label:
          feature.properties?.full_address ??
          feature.properties?.name ??
          trimmed,
      },
    ];
  });
}

/**
 * Turns coordinates from the browser into a name a person recognises.
 *
 * The Geolocation API returns numbers and nothing else, so without this the search bar
 * can only say something generic like "Your location", which tells the visitor nothing
 * about whether the browser actually placed them correctly.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  { token, signal }: { token: string; signal?: AbortSignal },
): Promise<string | null> {
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    access_token: token,
    limit: "1",
    types: "address,street,neighborhood,locality,place",
  });

  const response = await fetch(`${ENDPOINT.replace("/forward", "/reverse")}?${params}`, {
    signal,
  });
  if (!response.ok) return null;

  const body: { features?: MapboxFeature[] } = await response.json();
  const properties = body.features?.[0]?.properties;
  return (
    properties?.full_address ??
    properties?.name ??
    properties?.place_formatted ??
    null
  );
}
