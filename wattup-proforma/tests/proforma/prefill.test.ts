/**
 * Prefilling the form must not change the document.
 *
 * The static tool shipped `market: {}` and `design: {}` and let the engine fill
 * them in at build time, so thirteen market fields and seven branding fields sat
 * blank on screen while the printed document carried real values. The form now
 * seeds those defaults so they can be seen and edited.
 *
 * That is only safe because passing the defaults explicitly and letting the engine
 * merge them are the same operation. This proves it rather than assuming it: the
 * document rendered from the old empty-object inputs and from the prefilled ones
 * must be byte-identical.
 */
import { describe, expect, it } from 'vitest';

import { renderDoc, type ProformaAssets } from '@/lib/proforma/document';
import {
    buildModel,
    DEFAULT_INPUTS,
    DEFAULT_MARKET,
    DESIGN_DEFAULTS,
    type ProformaInputs,
} from '@/lib/proforma/model';
import { deepClone, freshInputs, mergeLoadedInputs } from '@/lib/proforma/state';

const ASSETS: ProformaAssets = {
    logo_type_light: 'data:image/svg+xml;base64,PHN2Zy8+',
    mark_dark: 'data:image/svg+xml;base64,PHN2Zy8+',
    cover_default: 'data:image/png;base64,AA==',
};

const render = (i: ProformaInputs) => renderDoc(buildModel(deepClone(i)), { ...ASSETS });

describe('prefilling the form', () => {
    it('puts every market default in the inputs', () => {
        expect(freshInputs().market).toEqual(DEFAULT_MARKET);
        // The static tool's own starting point, for contrast.
        expect(DEFAULT_INPUTS.market).toEqual({});
    });

    it('puts every branding default in the inputs', () => {
        expect(freshInputs().design).toEqual(DESIGN_DEFAULTS);
        expect(DEFAULT_INPUTS.design).toEqual({});
    });

    it('leaves the rendered document byte-identical', () => {
        const asShipped = deepClone(DEFAULT_INPUTS);
        const prefilled = freshInputs();
        expect(render(prefilled)).toBe(render(asShipped));
    });

    it('leaves the model byte-identical', () => {
        expect(buildModel(freshInputs())).toEqual(buildModel(deepClone(DEFAULT_INPUTS)));
    });

    it('still lets a typed value win over the default it replaced', () => {
        const edited = freshInputs();
        edited.design.badge = 'Draft';
        edited.market.aadt = '99,999';
        const model = buildModel(edited);
        expect(model.design.badge).toBe('Draft');
        expect(model.market.aadt).toBe('99,999');
        expect(render(edited)).not.toBe(render(freshInputs()));
    });

    it('an emptied field still overrides its default, as it always did', () => {
        const edited = freshInputs();
        edited.design.badge = '';
        expect(buildModel(edited).design.badge).toBe('');
    });
});

describe('loading a file, now that the form is prefilled', () => {
    it('a file with no branding shows the defaults rather than blanks', () => {
        const loaded = mergeLoadedInputs({ chargers: 20 } as never);
        expect(loaded.design).toEqual(DESIGN_DEFAULTS);
        expect(loaded.market).toEqual(DEFAULT_MARKET);
    });

    it('and renders exactly what the static tool rendered for that file', () => {
        // The old semantics: design and market replaced outright by the file's.
        const oldWay = Object.assign(deepClone(DEFAULT_INPUTS), { chargers: 20 }) as ProformaInputs;
        oldWay.design = {};
        oldWay.market = {};
        expect(render(mergeLoadedInputs({ chargers: 20 } as never))).toBe(render(oldWay));
    });

    it('a file that carries branding still wins over the defaults', () => {
        const loaded = mergeLoadedInputs({ design: { badge: 'Internal' } } as never);
        expect(loaded.design.badge).toBe('Internal');
        // and the keys the file did not mention are still there to edit
        expect(loaded.design.title1).toBe(DESIGN_DEFAULTS.title1);
    });

    it('a file that carries market figures still wins', () => {
        const loaded = mergeLoadedInputs({ market: { aadt: '1,234' } } as never);
        expect(loaded.market.aadt).toBe('1,234');
        expect(loaded.market.util_score).toBe(DEFAULT_MARKET.util_score);
    });
});
