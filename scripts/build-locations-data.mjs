/**
 * Generates lib/locations/data.ts from the signed-locations sheet.
 *
 * The sheet holds the property owner's legal entity, their notice address (several are
 * private homes), the parcel number, the sales rep and an internal site score. None of
 * that may reach the browser. This script exists so that guarantee is enforced by an
 * explicit allowlist rather than by remembering to leave columns out: it reads only the
 * PUBLIC_COLUMNS below and would have to be edited, in a reviewable diff, to leak one.
 *
 * Run: node scripts/build-locations-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = 'docs/station-finder/Wattup Location Signed.xlsx - Sheet1.csv';
const OUT = 'lib/locations/data.ts';

/** The only columns permitted to leave the sheet. */
const PUBLIC_COLUMNS = /** @type {const} */ ([
  'Location address',
  '# of Chargers',
  'Switchgear Ordered date',
]);

/**
 * Postcode registry: city name and approximate coordinates.
 *
 * City comes from here rather than from parsing the address string. The sheet formats
 * addresses inconsistently (some omit the comma before the city, some omit the state),
 * and a text heuristic silently produced a blank city for one row. A postcode maps to
 * exactly one city across these 27 sites, so this is deterministic.
 *
 * Coordinates are postcode-area centroids, not geocoded forecourt positions. At the
 * zoom this section renders that error is under one pixel. They MUST be replaced with
 * geocoded coordinates before any zoomed in view or driving directions ship.
 */
const POSTCODES = {
  '92374': { city: 'Redlands', coords: [34.0556, -117.1825] },
  '92503': { city: 'Riverside', coords: [33.9806, -117.3755] },
  '90703': { city: 'Cerritos', coords: [33.8583, -118.0648] },
  '92335': { city: 'Fontana', coords: [34.0922, -117.435] },
  '92354': { city: 'Loma Linda', coords: [34.0483, -117.2612] },
  '90248': { city: 'Gardena', coords: [33.8883, -118.309] },
  '92345': { city: 'Hesperia', coords: [34.4264, -117.3009] },
  '90620': { city: 'Buena Park', coords: [33.8675, -117.9981] },
  '90720': { city: 'Los Alamitos', coords: [33.803, -118.0725] },
  '92056': { city: 'Oceanside', coords: [33.1959, -117.32] },
  '92704': { city: 'Santa Ana', coords: [33.7175, -117.8878] },
  '91762': { city: 'Ontario', coords: [34.0633, -117.6509] },
  '90802': { city: 'Long Beach', coords: [33.7701, -118.1937] },
  '92126': { city: 'San Diego', coords: [32.9095, -117.1355] },
  '92154': { city: 'San Diego', coords: [32.5786, -117.0917] },
  '92009': { city: 'Carlsbad', coords: [33.1581, -117.3506] },
  '91910': { city: 'Chula Vista', coords: [32.6401, -117.0842] },
  '92562': { city: 'Murrieta', coords: [33.5539, -117.2139] },
  '91731': { city: 'El Monte', coords: [34.0686, -118.0276] },
  '95678': { city: 'Roseville', coords: [38.7521, -121.288] },
  '95242': { city: 'Lodi', coords: [38.1341, -121.2722] },
  '92346': { city: 'Highland', coords: [34.1283, -117.2087] },
  '91763': { city: 'Montclair', coords: [34.0775, -117.6897] },
  '92614': { city: 'Irvine', coords: [33.6846, -117.8265] },
};

/** Sites sharing a postcode need distinct points or their markers stack. */
const COORDS_BY_STREET = {
  '11265 Camino Ruiz': [32.9126, -117.1461],
  '3510 College Blvd': [33.2119, -117.2861],
  '1312 West Edinger Ave.': [33.7317, -117.8836],
};

/**
 * Strips the city, state and postcode tail off an address, leaving the street line.
 * The city is known from the postcode, so this cuts at the city rather than guessing
 * where the street ends.
 */
function parseAddress(raw) {
  const address = raw.replace(/\s+/g, ' ').trim();
  const postcode = address.match(/\b(\d{5})\b\s*$/)?.[1];
  if (!postcode) throw new Error(`No postcode in address: ${raw}`);

  const entry = POSTCODES[postcode];
  if (!entry) throw new Error(`Postcode ${postcode} is not in the registry: ${raw}`);

  let street = address.slice(0, address.lastIndexOf(postcode));
  const cityAt = street.toLowerCase().lastIndexOf(entry.city.toLowerCase());
  if (cityAt === -1) {
    throw new Error(`Address does not contain its postcode's city "${entry.city}": ${raw}`);
  }
  street = street.slice(0, cityAt).replace(/[,\s]+$/, '').trim();
  if (!street) throw new Error(`Empty street line: ${raw}`);

  return { street, city: entry.city, postcode, coords: entry.coords };
}

/** Minimal RFC 4180 reader: the sheet quotes addresses that contain commas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])),
  );
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const sites = [];

for (const row of rows) {
  const picked = Object.fromEntries(PUBLIC_COLUMNS.map((c) => [c, row[c] ?? '']));
  const raw = picked['Location address'];
  if (!raw) continue; // subtotal and spacer rows carry no address

  const parts = parseAddress(raw);
  const streetKey = Object.keys(COORDS_BY_STREET).find((k) => raw.startsWith(k));
  const coords = streetKey ? COORDS_BY_STREET[streetKey] : parts.coords;

  // Switchgear ordered means the build is funded for that year. It is the only signal
  // in the sheet for when a site opens, so it drives the status chip.
  const ordered = picked['Switchgear Ordered date'];
  const goLiveYear = ordered ? 2026 : 2027;

  sites.push({
    slug: slugify(`${parts.city}-${parts.street}`),
    name: `WattUp ${parts.city}`,
    street: parts.street,
    city: parts.city,
    region: 'CA',
    postalCode: parts.postcode,
    country: 'US',
    latitude: coords[0],
    longitude: coords[1],
    market: 'us-ca',
    status: 'PLANNED',
    goLiveYear,
    chargerCount: Number(picked['# of Chargers']) || 0,
  });
}

const file = `// Generated by scripts/build-locations-data.mjs. Do not edit by hand.
//
// Public fields only. The source sheet also holds owner entities, notice addresses,
// parcel numbers, sales reps and internal site scores; none of those are read here.
//
// Coordinates are postcode-area approximations, not geocoded site positions. Accurate
// enough at state zoom, and to be replaced before any zoomed in view ships.

import type { StationLocation } from './types';

export const STATIONS: StationLocation[] = ${JSON.stringify(sites, null, 2)};
`;

writeFileSync(OUT, file);
const cities = new Set(sites.map((s) => s.city));
console.log(
  `${OUT}: ${sites.length} sites, ${cities.size} cities, ` +
    `${sites.reduce((n, s) => n + s.chargerCount, 0)} chargers, ` +
    `${sites.filter((s) => s.goLiveYear === 2026).length} in 2026 / ` +
    `${sites.filter((s) => s.goLiveYear === 2027).length} in 2027`,
);
