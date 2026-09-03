/**
 * Types for the ported EVpin reader and parser in evpin.js.
 *
 * Hand written; evpin.js is vendor source. Note that evpinFetchText posts to this
 * app's own /api/tool/evpin-fetch rather than a third-party reader: that is
 * recorded as tool-freeze exception 1 in AGENTS.md, and it is why a landlord's
 * confidential report never leaves WattUp's infrastructure.
 */
import type { ProformaLocation, ProformaMarket } from './model';

export interface EvpinParsed {
    location?: Partial<ProformaLocation>;
    market?: ProformaMarket;
    deal?: { utilization?: number; price_kwh?: number };
}

export declare function parseEvpin(raw: string): EvpinParsed;
/** Rejects with a human-readable reason; never resolves with an empty body. */
export declare function evpinFetchText(url: string): Promise<{ text: string; via: string }>;
export declare function evpinNormalize(raw: string): string;
