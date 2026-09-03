/**
 * Types for the ported renderer in document.js.
 *
 * Hand written; document.js is vendor source that must not be edited. renderDoc
 * returns a complete HTML document as a string, which the builder hands to an
 * iframe's srcdoc and to print.
 */
import type { ProformaModel } from './model';

/**
 * The images and brand assets the document draws, all as data URLs so the srcdoc
 * frame and the print pipeline both resolve them without a network fetch.
 */
export interface ProformaAssets {
    logo_type_light?: string;
    mark_dark?: string;
    /** The station render shipped with the tool, used when no cover is uploaded. */
    cover_default?: string;
    cover?: string | null;
    aerial?: string | null;
    design?: string | null;
    gallery?: { src: string; caption?: string }[];
    [key: string]: unknown;
}

export declare function renderDoc(model: ProformaModel, assets: ProformaAssets): string;
export declare function usd(n: number): string;
export declare function n0(v: number | string): string;
export declare function pct(v: number, nd?: number): string;
export declare const MONTHS: string[];
