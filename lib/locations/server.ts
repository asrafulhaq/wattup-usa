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
