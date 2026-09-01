import { STATIONS } from "./data";
import { toPublicStation } from "./public";
import type { PublicStation, StationRecord } from "./types";

/**
 * Server side reads of the location records.
 *
 * Importing ./data is what makes this module server only, so keep it out of anything a
 * client component reaches. Pure helpers live in ./public precisely so they can be used
 * on both sides without dragging the private data across.
 */

/** Every signed site, both install years, in the shape the browser may see. */
export function getPublicStations(): PublicStation[] {
  return STATIONS.map(toPublicStation);
}

/** The full record, internal columns included. Never send this to the browser. */
export function getStationRecords(): StationRecord[] {
  return STATIONS;
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
