/**
 * The document must not change.
 *
 * The builder moved from four <script> tags to a bundled React app. The control
 * panel was rewritten; the engine was not. This test is what makes that claim
 * checkable rather than a promise: it runs the frozen vendor source in
 * private/tool/js/ and the ported modules in lib/proforma/ over the same inputs
 * and asserts the produced HTML is byte-identical.
 *
 * A single differing character fails it. If it fails after an intentional change,
 * the change belongs in private/tool/js/ first, and the port is copied across from
 * there. The vendor files are the reference, not the other way round.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { renderDoc as renderDocPorted, usd as usdPorted } from '@/lib/proforma/document';
import { buildModel as buildModelPorted, DEFAULT_INPUTS as DEFAULTS_PORTED } from '@/lib/proforma/model';
import { parseEvpin as parseEvpinPorted } from '@/lib/proforma/evpin';
import type { ProformaAssets } from '@/lib/proforma/document';
import type { ProformaInputs } from '@/lib/proforma/model';

const VENDOR = path.join(process.cwd(), 'private', 'tool', 'js');
const read = (f: string) => readFileSync(path.join(VENDOR, f), 'utf8');

/**
 * Load the vendor files the way the browser used to: as plain scripts sharing one
 * scope, with no module system. `new Function` is the closest thing to four script
 * tags, and it keeps the originals byte-for-byte untouched on disk.
 */
function loadVendor() {
    const src = `${read('model.js')}\n${read('doc.js')}\n${read('evpin.js')}\n
        return { buildModel, DEFAULT_INPUTS, renderDoc, usd, parseEvpin };`;
    return new Function(src)() as {
        buildModel: (i: ProformaInputs) => unknown;
        DEFAULT_INPUTS: ProformaInputs;
        renderDoc: (m: unknown, a: ProformaAssets) => string;
        usd: (n: number) => string;
        parseEvpin: (s: string) => unknown;
    };
}

const vendor = loadVendor();
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

/** A stand-in for an uploaded image. Its bytes are irrelevant; its presence is not. */
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const ASSET_BASE: ProformaAssets = {
    logo_type_light: 'data:image/svg+xml;base64,PHN2Zy8+',
    mark_dark: 'data:image/svg+xml;base64,PHN2Zy8+',
    cover_default: PIXEL,
};

/**
 * The matrix. Each case exercises a branch the document actually has, so parity is
 * proved across the shapes a real site takes rather than on the defaults alone.
 */
const CASES: { name: string; inputs: Partial<ProformaInputs>; assets: Partial<ProformaAssets> }[] = [
    { name: 'defaults, nothing uploaded', inputs: {}, assets: {} },
    {
        name: 'the reference site, as boot() seeds it',
        inputs: {
            location: {
                address: '8052 Talbert Avenue',
                city: 'Huntington Beach, CA 92646',
                county: 'Orange County',
                utility: 'Southern California Edison',
                ahj: 'City of Huntington Beach',
            },
        },
        assets: {},
    },
    { name: 'a cover uploaded, replacing the default', inputs: {}, assets: { cover: PIXEL } },
    { name: 'an aerial on the executive summary', inputs: {}, assets: { aerial: PIXEL } },
    { name: 'a to-scale design layout', inputs: {}, assets: { design: PIXEL } },
    {
        name: 'every image slot at once',
        inputs: {},
        assets: { cover: PIXEL, aerial: PIXEL, design: PIXEL },
    },
    {
        name: 'a gallery of one, which adds a page',
        inputs: {},
        assets: { gallery: [{ src: PIXEL, caption: 'North drive aisle' }] },
    },
    {
        name: 'a gallery of seven, which adds two pages and tests the 6-per-page split',
        inputs: {},
        assets: { gallery: Array.from({ length: 7 }, (_, i) => ({ src: PIXEL, caption: `Bay ${i + 1}` })) },
    },
    {
        name: 'a gallery caption carrying HTML, which must be escaped identically',
        inputs: {},
        assets: { gallery: [{ src: PIXEL, caption: '<script>alert(1)</script> & "quoted"' }] },
    },
    { name: 'validity window off', inputs: { validity_days: 0 }, assets: {} },
    { name: 'a long validity window', inputs: { validity_days: 120 }, assets: {} },
    { name: 'a fixed issue date', inputs: { prepared_date: 'January 15, 2027' }, assets: {} },
    { name: 'legacy host-share scaling', inputs: { full_opex_deduction: false }, assets: {} },
    { name: 'no escalation', inputs: { escalation: 0 }, assets: {} },
    { name: 'a single charger', inputs: { chargers: 1, ports_per_charger: 1 }, assets: {} },
    { name: 'a large site', inputs: { chargers: 64, charger_power_kw: 480 }, assets: {} },
    { name: 'one sensitivity row', inputs: { opex_sens_utils: [0.2] }, assets: {} },
    { name: 'many sensitivity rows', inputs: { opex_sens_utils: [0.35, 0.3, 0.25, 0.2, 0.15, 0.1] }, assets: {} },
    {
        name: 'custom branding, including colours',
        inputs: {
            design: {
                accent: '#FF6600',
                ink: '#101820',
                badge: 'Draft',
                title1: 'Site',
                title2: 'Economics',
                footer: 'WattUpUSA · Internal',
                design_caption: 'Concept layout',
            },
        },
        assets: {},
    },
    {
        name: 'market figures transcribed off a report',
        inputs: {
            market: {
                util_score: '4.4/5',
                util_rank: 'HIGH',
                ev_adoption: '9.02%',
                aadt: '42,549',
                pop_density: '1,527/km²',
            },
        },
        assets: {},
    },
    {
        name: 'text carrying HTML and quotes, which must be escaped identically',
        inputs: {
            location: {
                address: '<b>8052</b> "Talbert" & Co',
                city: 'A & B, CA',
                county: "O'Brien County",
                utility: '<script>x</script>',
                ahj: 'City of <i>Test</i>',
            },
            prepared_by: 'A & B "Partners"',
        },
        assets: {},
    },
    {
        name: 'empty strings everywhere the cover prints',
        inputs: {
            location: { address: '', city: '', county: '', utility: '', ahj: '' },
            prepared_by: '',
            prepared_email: '',
        },
        assets: {},
    },
];

describe('the ported engine produces byte-identical documents', () => {
    it.each(CASES.map((c) => [c.name, c] as const))('%s', (_name, testCase) => {
        const inputs = Object.assign(clone(vendor.DEFAULT_INPUTS), clone(testCase.inputs));
        const assets = Object.assign({}, ASSET_BASE, testCase.assets);

        const fromVendor = vendor.renderDoc(vendor.buildModel(clone(inputs)), clone(assets));
        const fromPorted = renderDocPorted(buildModelPorted(clone(inputs)), clone(assets));

        // Compare lengths first: a length mismatch names the size of the drift, which
        // is far easier to read than a diff of two 35 KB strings.
        expect(fromPorted.length).toBe(fromVendor.length);
        expect(fromPorted).toBe(fromVendor);
        expect(fromPorted.length).toBeGreaterThan(20_000);
    });

    it('the ported defaults are the vendor defaults', () => {
        expect(DEFAULTS_PORTED).toEqual(vendor.DEFAULT_INPUTS);
    });

    it('the ported model output matches the vendor model output', () => {
        const inputs = clone(vendor.DEFAULT_INPUTS);
        expect(buildModelPorted(clone(inputs))).toEqual(vendor.buildModel(clone(inputs)));
    });

    it('usd formats identically, since the KPI strip renders through it', () => {
        for (const n of [0, 1, 999, 1000, 24587, 3542331, -1200, 0.4]) {
            expect(usdPorted(n)).toBe(vendor.usd(n));
        }
    });

    it('the ported EVpin parser reads a report identically', () => {
        const report = [
            'Utilization Score 4.4/5 HIGH',
            'EV Adoption 9.02% +15% YoY',
            'Average Daily Traffic 42,549',
            'Highway Distance 2.3 mi',
            'Level 3 Ports within 10 miles 945',
            'Population Density 1,527/km2',
        ].join('\n');
        expect(parseEvpinPorted(report)).toEqual(vendor.parseEvpin(report));
    });
});
