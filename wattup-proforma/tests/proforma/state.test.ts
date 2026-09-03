/**
 * The state rules the control panel depends on.
 *
 * These were inline in private/tool/js/app.js and untestable. Each case below pins
 * a rule that, if it drifted, would corrupt a document without any visible error:
 * a lost `scale` turns 20% utilization into 2000%, a lost sensitivity fallback
 * empties a table, and the wrong merge on load silently resurrects default
 * branding over a saved one.
 */
import { describe, expect, it } from 'vitest';

import { buildModel, DEFAULT_INPUTS } from '@/lib/proforma/model';
import {
    applyEvpin,
    coerceFieldValue,
    DEFAULT_SENSITIVITY,
    deepClone,
    displayNumber,
    displayPctList,
    freshInputs,
    galleryPageCount,
    getPath,
    mergeLoadedInputs,
    mergeScenario,
    pageCountFor,
    pageCountLabel,
    setPath,
    slugFor,
} from '@/lib/proforma/state';

describe('dot paths', () => {
    it('reads a nested value', () => {
        expect(getPath({ a: { b: { c: 3 } } }, 'a.b.c')).toBe(3);
    });

    it('returns undefined through a missing branch rather than throwing', () => {
        expect(getPath({ a: null }, 'a.b.c')).toBeUndefined();
        expect(getPath({}, 'nope.nope')).toBeUndefined();
    });

    it('creates the branch it writes through', () => {
        const o: Record<string, unknown> = {};
        setPath(o, 'design.accent', '#FF0000');
        expect(o).toEqual({ design: { accent: '#FF0000' } });
    });

    it('replaces a non-object standing where a branch is needed', () => {
        const o: Record<string, unknown> = { design: 'not an object' };
        setPath(o, 'design.accent', '#00FF00');
        expect(o.design).toEqual({ accent: '#00FF00' });
    });
});

describe('field coercion', () => {
    it('divides a scaled number, so 20 percent is stored as 0.2', () => {
        expect(coerceFieldValue('number', '20', 100)).toBe(0.2);
    });

    it('leaves an unscaled number alone', () => {
        expect(coerceFieldValue('number', '310')).toBe(310);
    });

    it('keeps an emptied number field empty rather than turning it into 0', () => {
        expect(coerceFieldValue('number', '')).toBe('');
    });

    it('turns the host-share basis into a real boolean', () => {
        expect(coerceFieldValue('select', 'true')).toBe(true);
        expect(coerceFieldValue('select', 'false')).toBe(false);
    });

    it('parses a percent list into fractions', () => {
        expect(coerceFieldValue('pctlist', '25, 20, 15, 10')).toEqual([0.25, 0.2, 0.15, 0.1]);
    });

    it('drops non-positive and unparseable entries', () => {
        expect(coerceFieldValue('pctlist', '25, 0, -5, abc, 10')).toEqual([0.25, 0.1]);
    });

    it('falls back to the default list when nothing valid is left', () => {
        expect(coerceFieldValue('pctlist', 'abc, -1, 0')).toEqual(DEFAULT_SENSITIVITY);
        expect(coerceFieldValue('pctlist', '')).toEqual(DEFAULT_SENSITIVITY);
    });

    it('round-trips a scaled value through display and back', () => {
        expect(displayNumber(0.2, 100)).toBe('20');
        expect(coerceFieldValue('number', displayNumber(0.2, 100) as string, 100)).toBe(0.2);
    });

    it('shows nothing for an unset number', () => {
        expect(displayNumber(undefined)).toBe('');
        expect(displayNumber(null)).toBe('');
        expect(displayNumber('')).toBe('');
    });

    it('shows a percent list as percents', () => {
        expect(displayPctList([0.25, 0.2])).toBe('25, 20');
        expect(displayPctList(undefined)).toBe('');
    });
});

describe('page counting', () => {
    it('is six pages with no gallery', () => {
        expect(pageCountFor(0)).toBe(6);
    });

    it('adds one page per six images, rounding up', () => {
        expect(galleryPageCount(1)).toBe(1);
        expect(galleryPageCount(6)).toBe(1);
        expect(galleryPageCount(7)).toBe(2);
        expect(pageCountFor(7)).toBe(8);
        expect(pageCountFor(12)).toBe(8);
        expect(pageCountFor(13)).toBe(9);
    });

    it('labels the count the way the status line always has', () => {
        expect(pageCountLabel(6)).toBe('6 pages · US Letter · live preview');
    });
});

describe('the EVpin import', () => {
    it('fills location and market, and says what it filled', () => {
        const inputs = freshInputs();
        const filled = applyEvpin(inputs, {
            location: { city: 'Huntington Beach, CA 92646' },
            market: { aadt: '42,549' },
        });
        expect(inputs.location.city).toBe('Huntington Beach, CA 92646');
        expect(inputs.market.aadt).toBe('42,549');
        expect(filled).toEqual(['city → Huntington Beach, CA 92646', 'aadt → 42,549']);
    });

    it('never overwrites with a blank', () => {
        const inputs = freshInputs();
        inputs.location.county = 'Orange County';
        const filled = applyEvpin(inputs, { location: { county: '' } });
        expect(inputs.location.county).toBe('Orange County');
        expect(filled).toEqual([]);
    });

    it('turns underscores into spaces in the report line', () => {
        const inputs = freshInputs();
        const filled = applyEvpin(inputs, { market: { util_score: '4.4/5' } });
        expect(filled).toEqual(['util score → 4.4/5']);
    });

    /**
     * The regression this migration exists to fix. The static tool wrote these two
     * to `deal.*`, which buildModel never reads, so an imported utilization was
     * reported as filled and then thrown away.
     */
    it('writes utilization and price where the model actually reads them', () => {
        const inputs = freshInputs();
        applyEvpin(inputs, { deal: { utilization: 0.28, price_kwh: 0.55 } });
        expect(inputs.utilization).toBe(0.28);
        expect(inputs.price_kwh).toBe(0.55);
        expect((inputs as Record<string, unknown>).deal).toBeUndefined();
    });

    it('and those values actually move the model', () => {
        const base = buildModel(freshInputs());
        const imported = freshInputs();
        applyEvpin(imported, { deal: { utilization: 0.4 } });
        const after = buildModel(imported);
        expect(after.host_economics.mrr_y1).not.toBe(base.host_economics.mrr_y1);
        expect(after.assumptions.utilization).toBe(0.4);
    });
});

describe('filenames', () => {
    it('slugs the address', () => {
        const i = freshInputs();
        i.location.address = '8052 Talbert Avenue';
        expect(slugFor(i)).toBe('WattUpUSA_ProForma_8052_Talbert_Avenue');
    });

    it('collapses runs of punctuation and trims the edges', () => {
        const i = freshInputs();
        i.location.address = '  ...123 Main St., #4!!  ';
        expect(slugFor(i)).toBe('WattUpUSA_ProForma_123_Main_St_4');
    });

    it('falls back when there is no address', () => {
        const i = freshInputs();
        i.location.address = '';
        expect(slugFor(i)).toBe('WattUpUSA_ProForma_WattUpUSA_ProForma');
    });
});

describe('loading inputs, with the static tool’s exact merge semantics', () => {
    it('merges location onto the defaults', () => {
        const merged = mergeLoadedInputs({ location: { city: 'Fresno, CA' } } as never);
        expect(merged.location.city).toBe('Fresno, CA');
        expect(merged.location.address).toBe(DEFAULT_INPUTS.location.address);
    });

    it('REPLACES design and market, so an old file cannot inherit new defaults', () => {
        const merged = mergeLoadedInputs({ design: { accent: '#123456' } } as never);
        expect(merged.design).toEqual({ accent: '#123456' });
        expect(merged.market).toEqual({});
    });

    it('keeps every scalar the file carries', () => {
        const merged = mergeLoadedInputs({ chargers: 32, utilization: 0.3 } as never);
        expect(merged.chargers).toBe(32);
        expect(merged.utilization).toBe(0.3);
    });

    it('a scenario merges over the defaults', () => {
        const merged = mergeScenario({ chargers: 8 } as never);
        expect(merged.chargers).toBe(8);
        expect(merged.price_kwh).toBe(DEFAULT_INPUTS.price_kwh);
    });
});

describe('deepClone', () => {
    it('shares no reference with its source', () => {
        const a = freshInputs();
        const b = deepClone(a);
        b.location.city = 'changed';
        b.opex_sens_utils.push(0.99);
        expect(a.location.city).not.toBe('changed');
        expect(a.opex_sens_utils).not.toContain(0.99);
    });
});
