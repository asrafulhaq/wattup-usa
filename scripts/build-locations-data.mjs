/**
 * Generates prisma/seed-data/locations.ts from the signed-locations sheet.
 *
 * Captures EVERY column, including the internal ones: owner entity, notice address
 * (several are private homes), parcel number, sales rep and site score. Which of these
 * are ever exposed is a separate decision, and it lives in one place:
 * lib/locations/public.ts. Nothing here decides what the browser sees.
 *
 * Output is seed input, not application data. The database is the source of truth once
 * seeded, and the app reads it through lib/locations/server.ts. It lands under prisma/
 * rather than lib/ for two reasons: nothing under app/ or components/ can reach it, and
 * prisma/seed.ts runs under tsx rather than React, where an `import 'server-only'`
 * guard would throw at load.
 *
 * Fields the sheet does not own are absent by design. amenities, pricePerKwh and
 * connectors are set in the dashboard, so the seed must not carry a value that would
 * overwrite an edit on the next run.
 *
 * Run: node scripts/build-locations-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = 'docs/station-finder/Wattup Location Signed.xlsx - Sheet1.csv';
const OUT = 'prisma/seed-data/locations.ts';

/**
 * Every column in the sheet, mapped to its field name. Header text is reproduced as
 * the reader yields it (trimmed, upstream typos kept: "Swtichgear"), and a missing one
 * throws rather than silently producing an empty column.
 */
const COLUMNS = {
  'Location # signed': 'signedNumber',
  'Initial Notes': 'initialNotes',
  'Location # in pipeline': 'pipelineRef',
  Company: 'company',
  'Location address': 'addressRaw',
  'Notice Address': 'noticeAddress',
  "Accessor's Parcel # (APN)": 'apn',
  'Rating out of a 5': 'siteScore',
  '# of Chargers': 'chargerCount',
  '# of Swtichgear': 'switchgearCount',
  'Switchgear Ordered date': 'switchgearOrderedDate',
  'Sales Rep': 'salesRep',
};

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

/**
 * Loads the generated basemap so each site can be assigned the county it falls in.
 *
 * This doubles as a permanent check on the projection: if a site does not land inside
 * any California county polygon, its marker would be drawn off the coastline, and the
 * build fails here rather than shipping a map with a pin in the sea. Run
 * build-ca-geometry.mjs first.
 */
function loadGeometry() {
  const src = readFileSync('lib/locations/ca-geometry.ts', 'utf8');
  const projection = JSON.parse(
    src
      .slice(src.indexOf('CA_PROJECTION = {') + 16, src.indexOf('} as const'))
      .replace(/(\w+):/g, '"$1":')
      .replace(/,\s*$/, '') + '}',
  );
  const counties = JSON.parse(
    src.slice(src.indexOf('CA_COUNTIES: CountyShape[] = ') + 29, src.lastIndexOf('];') + 1),
  );
  return { projection, counties };
}

const toViewBox = (projection, lat, lon) => {
  const x = (lon * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return [
    ((x - projection.minX) / (projection.maxX - projection.minX)) * projection.width,
    ((projection.maxY - y) / (projection.maxY - projection.minY)) * projection.height,
  ];
};

/** "M x y L x y ... Z" subpaths back into rings of points. */
const ringsOfPath = (d) =>
  d
    .split('Z')
    .filter(Boolean)
    .map((sub) => sub.replace('M', '').split('L').map((pt) => pt.trim().split(/\s+/).map(Number)));

const pointInRing = ([px, py], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const { projection, counties } = loadGeometry();
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const sites = [];

const headers = Object.keys(rows[0] ?? {});
for (const header of Object.keys(COLUMNS)) {
  if (!headers.includes(header)) {
    throw new Error(`Sheet is missing expected column ${JSON.stringify(header)}`);
  }
}

for (const row of rows) {
  const raw = row['Location address'];
  // The sheet carries a "2026 install" subtotal, a "2027 Install Below:" separator and
  // trailing blanks. None has an address, which is what distinguishes them from a site.
  if (!raw) continue;

  const parts = parseAddress(raw);
  const streetKey = Object.keys(COORDS_BY_STREET).find((k) => raw.startsWith(k));
  const coords = streetKey ? COORDS_BY_STREET[streetKey] : parts.coords;

  const point = toViewBox(projection, coords[0], coords[1]);
  const county = counties.find((c) => ringsOfPath(c.d).some((r) => pointInRing(point, r)));
  if (!county) {
    throw new Error(
      `${parts.city} ${parts.postcode} projects to [${point.map((n) => n.toFixed(1))}], ` +
        'which is outside every California county. Its marker would sit off the map.',
    );
  }

  const value = (header) => row[header]?.trim() ?? '';
  const number = (header) => {
    const v = value(header);
    return v === '' ? null : Number(v);
  };

  // Switchgear ordered means the build is funded for that year. It is the only signal
  // in the sheet for when a site opens, so it drives the status chip.
  const orderedDate = value('Switchgear Ordered date');

  sites.push({
    // derived
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
    // Switchgear ordered for 2026 means the site is presented as open; everything else
    // is coming soon. The sheet records the order date, not a commissioning date, so
    // this reflects how the client asked the network to be presented rather than an
    // energisation status the sheet can prove.
    status: orderedDate ? 'LIVE' : 'PLANNED',
    goLiveYear: orderedDate ? 2026 : 2027,
    county: county.name,
    countyFips: county.fips,
    // 310 kW across the network, given by the client. Not in the sheet.
    maxPowerKw: 310,
    // amenities, pricePerKwh and connectors are deliberately absent. The sheet says
    // nothing about any of them, they are assigned per site in the dashboard, and a
    // value here would overwrite that assignment every time the seed runs.
    // straight from the sheet
    signedNumber: number('Location # signed'),
    initialNotes: value('Initial Notes'),
    pipelineRef: value('Location # in pipeline'),
    company: value('Company'),
    addressRaw: raw.replace(/\s+/g, ' ').trim(),
    noticeAddress: value('Notice Address'),
    apn: value("Accessor's Parcel # (APN)"),
    siteScore: number('Rating out of a 5'),
    chargerCount: number('# of Chargers') ?? 0,
    switchgearCount: number('# of Swtichgear'),
    switchgearOrderedDate: orderedDate || null,
    salesRep: value('Sales Rep'),
  });
}

const file = `// Generated by scripts/build-locations-data.mjs. Do not edit by hand.
//
// Seed input for prisma/seed.ts. Holds every column of the signed-locations sheet,
// including the owner's legal entity, their notice address (several are private homes),
// the parcel number, the sales rep and the internal site score.
//
// Nothing in app/ or components/ may import this. The application reads locations from
// the database through lib/locations/server.ts, and what of a row reaches the browser is
// decided in lib/locations/public.ts, in one place, and nowhere else.
//
// Coordinates here are postcode-area approximations, and they are the starting point
// only. scripts/geocode-locations.mjs replaces them with real geocoded positions after
// seeding, and the dashboard's Locate button fixes any single site. Do not treat this
// file's numbers as the ones in production.

/** The sheet-owned fields of a site. The rest of a Location is set in the dashboard. */
export interface SeedLocation {
  slug: string;
  name: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  market: string;
  status: 'LIVE' | 'UNDER_CONSTRUCTION' | 'PLANNED';
  goLiveYear: number;
  county: string;
  countyFips: string;
  maxPowerKw: number;
  signedNumber: number | null;
  initialNotes: string;
  pipelineRef: string;
  company: string;
  addressRaw: string;
  noticeAddress: string;
  apn: string;
  siteScore: number | null;
  chargerCount: number;
  switchgearCount: number | null;
  switchgearOrderedDate: string | null;
  salesRep: string;
}

export const SEED_LOCATIONS: SeedLocation[] = ${JSON.stringify(sites, null, 2)};
`;

writeFileSync(OUT, file);
const cities = new Set(sites.map((s) => s.city));
const usedCounties = new Set(sites.map((s) => s.countyFips));
console.log(
  `${OUT}: ${sites.length} sites, ${cities.size} cities, ` +
    `${sites.reduce((n, s) => n + s.chargerCount, 0)} chargers, ` +
    `${sites.filter((s) => s.goLiveYear === 2026).length} in 2026 / ` +
    `${sites.filter((s) => s.goLiveYear === 2027).length} in 2027, ` +
    `across ${usedCounties.size} counties`,
);
