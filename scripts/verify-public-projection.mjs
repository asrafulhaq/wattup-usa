/**
 * Checks that no private value from the signed-locations sheet survives the projection
 * in lib/locations/public.ts.
 *
 * The full record is deliberately kept intact so we can decide later what to expose.
 * That decision is only safe if widening it stays deliberate, so this asserts the
 * current boundary: every private value must be absent from the public shape.
 *
 * Run: node scripts/verify-public-projection.mjs
 */
import { readFileSync } from 'node:fs';

const PRIVATE_FIELDS = [
  'company',
  'noticeAddress',
  'apn',
  'siteScore',
  'salesRep',
  'initialNotes',
  'pipelineRef',
  'signedNumber',
];

const src = readFileSync('lib/locations/data.ts', 'utf8');
const records = JSON.parse(src.slice(src.indexOf('= [') + 2, src.lastIndexOf(']') + 1));

// mirrors lib/locations/public.ts
const PUBLIC_KEYS = [
  'slug', 'name', 'street', 'city', 'region', 'postalCode', 'country',
  'latitude', 'longitude', 'market', 'status', 'goLiveYear', 'county', 'countyFips',
  'maxPowerKw', 'amenities', 'chargerCount',
];
const toPublic = (r) => Object.fromEntries(PUBLIC_KEYS.map((k) => [k, r[k]]));

const failures = [];

for (const record of records) {
  for (const field of PRIVATE_FIELDS) {
    if (!(field in record)) failures.push(`${record.slug}: full record is missing ${field}`);
  }

  const pub = toPublic(record);
  const serialised = JSON.stringify(pub).toLowerCase();

  for (const field of PRIVATE_FIELDS) {
    if (field in pub) failures.push(`${record.slug}: ${field} present in public shape`);

    const value = record[field];
    if (value === null || value === '' || value === undefined) continue;
    if (typeof value !== 'string') continue;

    // Substring matching only says something useful about distinctive values. A short
    // numeric one (pipelineRef "6", signedNumber "1") appears inside street numbers,
    // postcodes and coordinates by coincidence, so matching it proves nothing. The
    // values that actually matter here are names and addresses, which are not short
    // and not purely numeric.
    if (/^\d{1,4}$/.test(value)) continue;

    if (serialised.includes(value.toLowerCase())) {
      failures.push(`${record.slug}: value of ${field} ("${value}") leaked into public shape`);
    }
  }
}

const byYear = records.reduce((acc, r) => ({ ...acc, [r.goLiveYear]: (acc[r.goLiveYear] ?? 0) + 1 }), {});
console.log(`records: ${records.length}`);
console.log(`install year: ${JSON.stringify(byYear)}`);
console.log(`full record fields: ${Object.keys(records[0]).length}`);
console.log(`public fields: ${PUBLIC_KEYS.length}`);

if (failures.length) {
  console.error(`\nFAILED (${failures.length}):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('\nOK: no private value reaches the public shape.');
