/**
 * The builder's state, and the pure functions that move it.
 *
 * Everything here was behaviour in private/tool/js/app.js. It lives apart from the
 * React components so it can be tested without a DOM, which is what lets the
 * migration prove it kept the semantics rather than assert it.
 *
 * One deliberate behaviour change from the static tool is marked FIXED below.
 */
import type { EvpinParsed } from './evpin';
import {
    DEFAULT_INPUTS,
    DEFAULT_MARKET,
    DESIGN_DEFAULTS,
    type ProformaInputs,
} from './model';

/** The three single-image slots the document draws. */
export type ImageSlot = 'cover' | 'aerial' | 'design';

export type ImageSlots = Record<ImageSlot, string | null>;

export interface GalleryItem {
    /** A data URL. Images never leave the browser. */
    src: string;
    caption: string;
}

export type EvpinStatus = '' | 'busy' | 'ok' | 'warn';

export interface EvpinState {
    status: EvpinStatus;
    detail: string;
}

export const EMPTY_IMAGES: ImageSlots = { cover: null, aerial: null, design: null };

/** The document is six pages, plus one Site Placement page per six gallery images. */
export const BASE_PAGE_COUNT = 6;
export const GALLERY_PER_PAGE = 6;

export function galleryPageCount(n: number): number {
    return Math.ceil((n || 0) / GALLERY_PER_PAGE);
}

export function pageCountFor(galleryLength: number): number {
    return BASE_PAGE_COUNT + galleryPageCount(galleryLength);
}

export function pageCountLabel(pages: number): string {
    return `${pages} pages · US Letter · live preview`;
}

export function deepClone<T>(o: T): T {
    return JSON.parse(JSON.stringify(o)) as T;
}

/**
 * A fresh set of inputs, with every default the engine holds already in the form.
 *
 * DEFAULT_INPUTS ships `market: {}` and `design: {}`, and the engine fills them in
 * at build time with `Object.assign({}, DEFAULTS, input)`. That is why the static
 * tool showed thirteen blank market fields and seven blank branding fields while
 * the document printed real values: the numbers existed, just nowhere the user
 * could see or edit them without retyping one from scratch.
 *
 * Seeding them here puts the same values in the form. **The document does not
 * change**, because passing the defaults explicitly and letting the engine merge
 * them are the same thing, and tests/proforma/prefill.test.ts proves it byte for
 * byte rather than asserting it.
 */
export function freshInputs(): ProformaInputs {
    const inputs = deepClone(DEFAULT_INPUTS);
    inputs.market = deepClone(DEFAULT_MARKET);
    inputs.design = deepClone(DESIGN_DEFAULTS);
    return inputs;
}

/**
 * The site boot() seeds when there is nothing to restore, so the preview is never
 * empty on a first visit.
 */
export const REFERENCE_LOCATION = {
    address: '8052 Talbert Avenue',
    city: 'Huntington Beach, CA 92646',
    county: 'Orange County',
    utility: 'Southern California Edison',
    ahj: 'City of Huntington Beach',
} as const;

/* ---------------- dot-path access, as app.js had it ---------------- */

export function getPath(obj: unknown, path: string): unknown {
    return path
        .split('.')
        .reduce<unknown>(
            (o, k) => (o === undefined || o === null ? undefined : (o as Record<string, unknown>)[k]),
            obj
        );
}

export function setPath(obj: Record<string, unknown>, path: string, val: unknown): void {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
        o = o[parts[i]] as Record<string, unknown>;
    }
    o[parts[parts.length - 1]] = val;
}

/* ---------------- field coercion ---------------- */

/** The fallback the static tool drops back to when a sensitivity list parses to nothing. */
export const DEFAULT_SENSITIVITY = [0.25, 0.2, 0.15, 0.1];

/**
 * Turn what a control reports into what the model stores. Kept in one place so the
 * number, select and percent-list rules cannot drift between field components.
 */
export function coerceFieldValue(
    type: string,
    raw: string,
    scale?: number
): string | number | boolean | number[] {
    if (type === 'number') {
        if (raw === '') return '';
        const n = Number(raw);
        return scale ? n / scale : n;
    }
    if (type === 'select') {
        return raw === 'true' ? true : raw === 'false' ? false : raw;
    }
    if (type === 'pctlist') {
        const list = raw
            .split(',')
            .map((x) => parseFloat(x.trim()) / 100)
            .filter((x) => !isNaN(x) && x > 0);
        return list.length ? list : [...DEFAULT_SENSITIVITY];
    }
    return raw;
}

/** What a number field shows for a stored value: 0.2 with scale 100 displays as 20. */
export function displayNumber(raw: unknown, scale?: number): string {
    if (raw === undefined || raw === null || raw === '') return '';
    return String(scale ? +(Number(raw) * scale).toFixed(4) : raw);
}

/** What a percent-list field shows: the stored fractions back as percents. */
export function displayPctList(raw: unknown): string {
    return ((raw as number[]) || []).map((x) => Number(x) * 100).join(', ');
}

/* ---------------- EVpin ---------------- */

/**
 * Copy what the parser recognised into the inputs, and report what it filled.
 *
 * FIXED, and the one deliberate behaviour change in this migration: the static
 * tool wrote utilization and retail price to `deal.utilization` and
 * `deal.price_kwh`, but buildModel reads `utilization` and `price_kwh` from the top
 * level and has no `deal` key at all, so both values were silently discarded on
 * every single import while the UI reported them as filled. They now write the
 * paths the model actually reads. Recorded in
 * docs/plan/PROFORMA-NEXTJS-MIGRATION.md section 2.3.
 */
export function applyEvpin(inputs: ProformaInputs, parsed: EvpinParsed): string[] {
    const filled: string[] = [];
    const put = (path: string, val: unknown, label: string) => {
        if (val === undefined || val === null || val === '') return;
        setPath(inputs as unknown as Record<string, unknown>, path, val);
        filled.push(`${label} → ${String(val)}`);
    };

    for (const [k, v] of Object.entries(parsed.location || {})) {
        put(`location.${k}`, v, k.replace(/_/g, ' '));
    }
    for (const [k, v] of Object.entries(parsed.market || {})) {
        put(`market.${k}`, v, k.replace(/_/g, ' '));
    }
    if (parsed.deal) {
        if (parsed.deal.utilization) put('utilization', parsed.deal.utilization, 'utilization');
        if (parsed.deal.price_kwh) put('price_kwh', parsed.deal.price_kwh, 'retail price');
    }
    return filled;
}

/** The shortest paste the static tool would attempt to read. */
export const MIN_EVPIN_TEXT = 60;

/* ---------------- import and export ---------------- */

export function slugFor(inputs: ProformaInputs): string {
    const a = (inputs.location.address || 'WattUpUSA_ProForma')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    return `WattUpUSA_ProForma_${a}`;
}

/**
 * Merge a loaded inputs.json over the defaults.
 *
 * Location merges onto the default location, as the static tool did. Design and
 * market now merge onto the DEFAULTS rather than replacing them outright: the
 * static tool assigned `json.design || {}` straight over the top, so loading a
 * file that carried no branding emptied all seven branding fields on screen while
 * the document went on printing the defaults the engine merged back in. With the
 * form prefilled, that inconsistency would be visible on every load.
 *
 * **The document is unaffected either way**, which is what makes this safe: the
 * engine merges the same defaults under whatever it is given, so a file's values
 * still win and an absent value still resolves to the default.
 */
export function mergeLoadedInputs(json: Partial<ProformaInputs>): ProformaInputs {
    const merged = Object.assign(freshInputs(), json) as ProformaInputs;
    merged.location = Object.assign({}, DEFAULT_INPUTS.location, json.location || {});
    merged.design = Object.assign({}, DESIGN_DEFAULTS, json.design || {});
    merged.market = Object.assign({}, DEFAULT_MARKET, json.market || {});
    return merged;
}

/** Merge a saved scenario over the defaults. Scenarios hold inputs only. */
export function mergeScenario(saved: Partial<ProformaInputs>): ProformaInputs {
    return Object.assign(freshInputs(), saved) as ProformaInputs;
}
