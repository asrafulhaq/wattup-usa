// @ts-nocheck
/* PORTED VERBATIM from private/tool/js/evpin.js. Do not edit the body.
 *
 * The bytes between this header and the export block at the end are exactly the
 * file named above, which is the frozen vendor source. The document this produces
 * must stay byte-identical to what the static build produces, and
 * tests/proforma/engine-parity.test.ts fails on a single differing character.
 *
 * If you need to change behaviour here, change it in private/tool/js/evpin.js first, re-run the
 * parity test, and copy the result across. Types live in evpin.d.ts. */

/* EVpin site-report import.
   Two paths, same parser:
     1. paste a shareable report URL  -> fetched by this site, see below
     2. paste the report text itself  -> parsed directly (works for login-walled reports)
   Only fields the report actually states are returned. Nothing is invented. */

/* THE ONE EDIT EVER MADE TO private/tool/. Checklist 5.15, ADR 0001.

   This used to read the pasted URL through r.jina.ai and api.allorigins.win,
   two unaffiliated services, so a landlord's confidential report URL and its
   whole contents passed through companies WattUp has no agreement with. It now
   goes to this site's own /api/tool/evpin-fetch, which is members only and
   fetches only https EVpin hosts that resolve to public addresses.

   Everything below the parser line is untouched, as is the paste-the-text-
   yourself path. To revert, restore the EVPIN_READERS array from git history:
   nothing else here changed. */
const EVPIN_FETCH_ENDPOINT = '/api/tool/evpin-fetch';

async function evpinFetchText(url) {
  const tried = [];
  try {
    const r = await fetch(EVPIN_FETCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ url: url })
    });
    if (!r.ok) {
      tried.push(r.status === 403 ? 'not signed in' : r.status + ' from this site');
    } else {
      const data = await r.json();
      const txt = data && data.text;
      if (txt && txt.length > 200) return { text: txt, via: (data && data.via) || 'evpin.com' };
      tried.push('empty body from ' + ((data && data.via) || 'evpin.com'));
    }
  } catch (e) {
    tried.push('blocked at this site');
  }
  throw new Error('Could not read that link (' + tried.join('; ') + ')');
}

/* ---------------- parser ---------------- */

function evpinNormalize(raw) {
  return String(raw)
    .replace(/\r/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

// value that follows a label, on the same line or the next one
function afterLabel(text, labels, valueRe) {
  for (const lab of labels) {
    const re = new RegExp(lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:·—-]?\\s*\\n?\\s*(.{0,80})', 'i');
    const m = text.match(re);
    if (!m) continue;
    const chunk = m[1];
    if (!valueRe) {
      const v = chunk.split('\n')[0].trim();
      if (v) return v;
      continue;
    }
    const v = chunk.match(valueRe);
    if (v) return v[1] !== undefined ? v[1] : v[0];
  }
  return null;
}

const RE_PCT = /(\d{1,3}(?:\.\d+)?\s*%)/;
const RE_NUM = /(\d{1,3}(?:,\d{3})+|\d{3,})/;
const RE_SCORE = /(\d(?:\.\d)?\s*\/\s*5)/;
const RE_MONEY_KWH = /\$\s?(\d+\.\d+)\s*\/?\s*kWh/i;

function parseEvpin(raw) {
  const t = evpinNormalize(raw);
  const location = {}, market = {}, deal = {};

  // ---- address ----
  const addr = t.match(/\b(\d{2,6}\s+[A-Z][A-Za-z0-9.'-]*(?:\s+[A-Z][A-Za-z0-9.'-]*){0,4}\s+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Highway|Hwy|Parkway|Pkwy|Court|Ct|Place|Pl|Loop|Circle|Cir|Terrace|Trail))\b/);
  if (addr) location.address = addr[1].trim();

  const tc = location.address ? t.replace(location.address, ' ') : t;
  const csz = tc.match(/([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2}),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b/);
  if (csz) {
    const city = csz[1].replace(/^(?:Location|Address|Site|City|Property)\s+/i, '').replace(/\s+/g, ' ').trim();
    if (city) location.city = city + ', ' + csz[2] + ' ' + csz[3];
  }

  const cty = t.match(/\b([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2})\s+County\b/);
  if (cty) location.county = cty[1] + ' County';

  // ---- utility / AHJ ----
  const util = afterLabel(t, ['Electric utility', 'Power Utilities', 'Utility company', 'Serving utility', 'Utility'], /^\s*([A-Za-z][A-Za-z0-9 &.'-]{3,50})/);
  if (util) location.utility = util.trim();

  const ahj = afterLabel(t, ['Where to file permits \\(AHJ\\)', 'Permitting Jurisdiction', 'Permitting jurisdiction', 'AHJ'], /^\s*([A-Za-z][A-Za-z0-9 &.'-]{3,50})/);
  if (ahj) location.ahj = ahj.trim();

  // ---- scores & demand ----
  const score = afterLabel(t, ['Utilization Score', 'Utilization score', 'Site utilization score'], RE_SCORE);
  if (score) market.util_score = score.replace(/\s/g, '');

  const rank = t.match(/\b(HIGH|MEDIUM|MODERATE|LOW)\b\s*(?:rank|total rank)?/i);
  if (rank) market.util_rank = rank[1].toUpperCase();

  const adoptM = t.match(/EV\s*[Aa]doption(?!\s*rate)\s*[:·—-]?\s*\n?\s*(\d{1,2}(?:\.\d+)?)\s*%/)
              || t.match(/EV\s*[Aa]doption[^%\n]{0,40}?(?<![+-]\s?)(\d{1,2}(?:\.\d+)?)\s*%/);
  if (adoptM) market.ev_adoption = adoptM[1] + '%';

  const yoy = t.match(/EV\s*[Aa]doption[^\n]{0,60}?([+-]\s?\d{1,3}%\s*YoY)/);
  if (yoy) market.ev_adoption_yoy = yoy[1].replace(/\s+/g, ' ').replace('+ ', '+');

  const traffic = afterLabel(t, ['Travel Patterns', 'Travel patterns', 'Annual average daily traffic', 'AADT', 'Average daily traffic'], RE_NUM);
  if (traffic) market.aadt = traffic;

  const infra = afterLabel(t, ['Existing Infrastructure', 'Existing infrastructure', 'L3 ports within 10 mi', 'L3 ports'], /(\d[\d,]*)/);
  if (infra) market.l3_ports_10mi = infra;

  const power = afterLabel(t, ['Purchasing Power', 'Purchasing power', 'Entry-EV purchasing power'], RE_PCT);
  if (power) market.purchasing_power = power.replace(/\s/g, '');

  const bevs = afterLabel(t, ['Total BEVs \\+ PHEV', 'BEVs \\+ PHEVs', 'Registered EVs', 'Total registered EVs'], RE_NUM);
  if (bevs) market.county_ev_total = bevs;

  const dens = afterLabel(t, ['Population density', 'Pop density'], /([\d,]+\s*\/\s*km(?:²|2)?)/i);
  if (dens) market.pop_density = dens.replace(/\s/g, '');

  const hwy = afterLabel(t, ['Distance from highway', 'Distance to highway', 'Highway distance', 'Nearest highway'], /(\d+(?:\.\d+)?\s*mi)/i);
  if (hwy) market.hwy_dist = hwy.replace(/\s+/g, ' ');

  const amen = afterLabel(t, ['Amenities within 10-min walk', 'Amenities', 'Nearby amenities'], /(\d+\+?)/);
  if (amen) market.amenities = amen;

  const proj27 = afterLabel(t, ['Projected EVs', 'EV growth · projected', 'Projected EV'], RE_NUM);
  if (proj27) market.county_ev_proj_2027 = proj27;

  // ---- deal-side hints ----
  const base = t.match(/Base[- ]case projection\s*[:·—-]?\s*(\d{1,3})\s*%/i);
  if (base) deal.utilization = Number(base[1]) / 100;

  const price = t.match(RE_MONEY_KWH);
  if (price) deal.price_kwh = Number(price[1]);

  // strip empties
  for (const o of [location, market, deal]) {
    for (const k of Object.keys(o)) if (o[k] === null || o[k] === '' || o[k] === undefined) delete o[k];
  }
  return { location, market, deal };
}

export { parseEvpin, evpinFetchText, evpinNormalize };
