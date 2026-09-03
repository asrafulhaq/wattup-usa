/**
 * Every explanation must survive the migration.
 *
 * The section notes and field hints are the tool's documentation: they tell a
 * salesperson what a number does to the model before they change it. The React
 * panel must carry all of them, word for word, and must not quietly drop a
 * placeholder, a unit, a step or a scale either, because a missing `scale` turns a
 * 20% utilization into 2000%.
 *
 * So this re-parses the SECTIONS array out of the frozen private/tool/js/app.js and
 * deep-compares it with the ported config. It fails on any drift in either
 * direction, including a field added here that the static tool never had.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { RAIL_INTRO_HTML, SECTIONS, type Section } from '@/lib/proforma/sections';

const APP_JS = path.join(process.cwd(), 'private', 'tool', 'js', 'app.js');

/**
 * Pull the SECTIONS literal out of app.js and evaluate it on its own. The rest of
 * that file touches the DOM and calls boot(), so it cannot simply be imported; the
 * array itself is pure data.
 */
function vendorSections(): Section[] {
    const src = readFileSync(APP_JS, 'utf8');
    const start = src.indexOf('const SECTIONS = [');
    const end = src.indexOf('\n];\n', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const literal = src.slice(start + 'const SECTIONS = '.length, end + '\n]'.length);
    return new Function(`return ${literal};`)() as Section[];
}

/** The intro paragraph, whitespace-collapsed so indentation is not the thing tested. */
function vendorIntro(): string {
    const src = readFileSync(APP_JS, 'utf8');
    const start = src.indexOf('<div class="intro">') + '<div class="intro">'.length;
    const end = src.indexOf('</div>', start);
    return src.slice(start, end).replace(/\s+/g, ' ').trim();
}

const vendor = vendorSections();

describe('the ported section config matches the static tool', () => {
    it('has the same number of sections', () => {
        expect(SECTIONS).toHaveLength(vendor.length);
        expect(SECTIONS.length).toBe(8);
    });

    it('is deep-equal to the vendor config, notes and hints included', () => {
        expect(SECTIONS).toEqual(vendor);
    });

    it.each(vendor.map((s, i) => [s.n, s.title, i] as const))(
        'section %s %s survives whole',
        (n, title, i) => {
            const mine = SECTIONS[i];
            expect(mine.id).toBe(vendor[i].id);
            expect(mine.n).toBe(n);
            expect(mine.title).toBe(title);
            expect(mine.note).toBe(vendor[i].note);
            expect(mine.fields).toHaveLength(vendor[i].fields.length);
        }
    );

    it('carries every note, none of them empty', () => {
        const withNotes = SECTIONS.filter((s) => s.note);
        expect(withNotes).toHaveLength(8);
        for (const s of withNotes) expect(s.note!.length).toBeGreaterThan(80);
    });

    it('carries every field hint', () => {
        const hints = SECTIONS.flatMap((s) => s.fields).filter((f) => f.hint).map((f) => f.hint);
        const vendorHints = vendor.flatMap((s) => s.fields).filter((f) => f.hint).map((f) => f.hint);
        expect(hints).toEqual(vendorHints);
        expect(hints).toHaveLength(4);
    });

    it('keeps every scale, so a stored 0.2 still displays as 20', () => {
        const scaled = SECTIONS.flatMap((s) => s.fields).filter((f) => f.scale);
        expect(scaled.map((f) => [f.k, f.scale])).toEqual(
            vendor.flatMap((s) => s.fields).filter((f) => f.scale).map((f) => [f.k, f.scale])
        );
        expect(scaled.length).toBeGreaterThan(0);
        for (const f of scaled) expect(f.scale).toBe(100);
    });

    it('keeps every unit, step, min and placeholder', () => {
        const shape = (list: Section[]) =>
            list.flatMap((s) => s.fields).map((f) => [f.k, f.unit, f.step, f.min, f.ph, f.half, f.type]);
        expect(shape(SECTIONS)).toEqual(shape(vendor));
    });

    it('keeps the host-share basis options, whose values become real booleans', () => {
        const f = SECTIONS.flatMap((s) => s.fields).find((x) => x.k === 'full_opex_deduction');
        expect(f?.options).toEqual([
            { v: 'true', l: 'Net Charging Revenue (all six costs)' },
            { v: 'false', l: 'Legacy reference scaling' },
        ]);
    });

    it('keeps the three image slots, in order', () => {
        const slots = SECTIONS.flatMap((s) => s.fields).filter((f) => f.type === 'image').map((f) => f.slot);
        expect(slots).toEqual(['cover', 'aerial', 'design']);
    });

    it('carries the intro paragraph verbatim', () => {
        expect(RAIL_INTRO_HTML.replace(/\s+/g, ' ').trim()).toBe(vendorIntro());
    });
});
