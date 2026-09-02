/**
 * Replaces the seeded postcode approximations with real geocoded coordinates.
 *
 * The seed places each site at the centre of its postcode area, which is accurate enough
 * at state zoom and visibly wrong once a station page draws a 780px map: the pin lands in
 * the middle of a suburb rather than on the forecourt.
 *
 * Reports before it writes. Every move is printed with the distance it travelled, and a
 * result is refused rather than written when it looks like a mismatch, because a
 * geocoder confidently returning the wrong forecourt is worse than the approximation it
 * replaced. Two guards, because the first one alone missed a real case:
 *
 *   distance   further than MAX_DRIFT_MILES means it matched something else entirely.
 *   city       the returned address must still name our city. "7872-7876 Valley View St"
 *              was answered with a street centroid in Cypress, three miles from the
 *              Buena Park site and comfortably inside the distance guard.
 *
 *   node scripts/geocode-locations.mjs            # report only, writes nothing
 *   node scripts/geocode-locations.mjs --apply    # write the accepted moves
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');

/** Beyond this, assume the geocoder matched something else and keep what we have. */
const MAX_DRIFT_MILES = 25;

/** Mapbox asks for one request at a time on the free tier; this stays well inside it. */
const DELAY_MS = 220;

const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocode(query, token) {
  const params = new URLSearchParams({
    q: query,
    access_token: token,
    limit: '1',
    country: 'us',
    types: 'address,street',
  });

  const response = await fetch(`${ENDPOINT}?${params}`);
  if (!response.ok) throw new Error(`geocoder returned ${response.status}`);

  const body = await response.json();
  const feature = body?.features?.[0]?.properties;
  if (!feature?.coordinates) return null;

  return {
    latitude: feature.coordinates.latitude,
    longitude: feature.coordinates.longitude,
    label: feature.full_address ?? feature.name ?? query,
    // Mapbox grades the match; anything but "exact" is worth a second look.
    accuracy: feature.match_code?.confidence ?? 'unknown',
  };
}

/**
 * Geocodes an address, retrying a hyphenated street range with just its first number.
 *
 * A range like "7872-7876 Valley View St" is a real way to write a multi-unit address and
 * a string no geocoder resolves: Mapbox drops to the street centroid, which can land in
 * the neighbouring town. The first number is a real address and resolves exactly.
 */
async function geocodeAddress(location, token) {
  const tail = `${location.city}, ${location.region} ${location.postalCode}`;
  const attempts = [`${location.street}, ${tail}`];

  const range = location.street.match(/^(\d+)\s*-\s*\d+(\s.*)$/);
  if (range) attempts.push(`${range[1]}${range[2]}, ${tail}`);

  let last = null;
  for (const query of attempts) {
    const result = await geocode(query, token);
    if (!result) continue;
    last = result;
    if (result.accuracy === 'exact') return result;
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
  return last;
}

async function main() {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error('MAPBOX_ACCESS_TOKEN is not set.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const locations = await prisma.location.findMany({
    orderBy: [{ city: 'asc' }],
    select: {
      id: true,
      name: true,
      street: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(
    `${locations.length} locations, ${APPLY ? 'APPLYING' : 'dry run, nothing will be written'}\n`,
  );

  const accepted = [];
  const rejected = [];
  const failed = [];

  for (const location of locations) {
      let result = null;
    try {
      result = await geocodeAddress(location, token);
    } catch (error) {
      failed.push({ location, reason: error.message });
      continue;
    }

    if (!result) {
      failed.push({ location, reason: 'no match' });
      continue;
    }

    const miles = haversineMiles(
      location.latitude,
      location.longitude,
      result.latitude,
      result.longitude,
    );

    // The returned address must still name our city. This is the guard that catches a
    // confident match on the wrong forecourt, which distance alone does not.
    const cityMatches = result.label
      .toLowerCase()
      .includes(location.city.toLowerCase());

    const row = { location, result, miles };
    if (miles > MAX_DRIFT_MILES) rejected.push({ ...row, why: `moved ${miles.toFixed(1)} mi` });
    else if (!cityMatches) rejected.push({ ...row, why: 'returned a different city' });
    else accepted.push(row);

    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  console.log('MOVED');
  for (const { location, result, miles } of accepted.sort((a, b) => b.miles - a.miles)) {
    console.log(
      `  ${miles.toFixed(2).padStart(6)} mi  ${location.city.padEnd(16)} ` +
        `${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}  [${result.accuracy}]`,
    );
  }

  if (rejected.length > 0) {
    console.log('\nREJECTED, left exactly as they were');
    for (const { location, result, why } of rejected) {
      console.log(`  ${location.city.padEnd(16)} ${why}  ->  ${result.label}`);
    }
  }

  if (failed.length > 0) {
    console.log('\nNO RESULT, left as they were');
    for (const { location, reason } of failed) {
      console.log(`  ${location.city}: ${reason}`);
    }
  }

  if (APPLY) {
    for (const { location, result } of accepted) {
      await prisma.location.update({
        where: { id: location.id },
        data: { latitude: result.latitude, longitude: result.longitude },
      });
    }
    console.log(`\nWrote ${accepted.length} locations.`);
    console.log(
      'The public pages cache for an hour; a dashboard save or a redeploy refreshes them.',
    );
  } else {
    console.log(`\nDry run. Re-run with --apply to write ${accepted.length} locations.`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
