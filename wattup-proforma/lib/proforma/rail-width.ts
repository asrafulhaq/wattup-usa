/**
 * How wide the control rail is, and the limits it may be dragged between.
 *
 * The width is a per-device preference, so it lives in localStorage next to the
 * scenarios rather than in the document or the session. Every access is guarded
 * the same way scenarios.ts guards its own: a private window or a full quota
 * degrades to the default rather than throwing on a drag.
 */
export const RAIL_WIDTH_KEY = 'wattup_proforma_rail_width_v1';

/** Narrower than this and the paired half-width fields stop fitting side by side. */
export const RAIL_MIN = 280;
/** Wider than this and the document has less room than the form describing it. */
export const RAIL_MAX = 560;
export const RAIL_DEFAULT = 340;

export function clampRailWidth(px: number): number {
    if (!Number.isFinite(px)) return RAIL_DEFAULT;
    return Math.min(RAIL_MAX, Math.max(RAIL_MIN, Math.round(px)));
}

export function readRailWidth(): number {
    try {
        const raw = window.localStorage.getItem(RAIL_WIDTH_KEY);
        return raw ? clampRailWidth(Number(raw)) : RAIL_DEFAULT;
    } catch {
        return RAIL_DEFAULT;
    }
}

export function writeRailWidth(px: number): void {
    try {
        window.localStorage.setItem(RAIL_WIDTH_KEY, String(clampRailWidth(px)));
    } catch {
        /* a preference that cannot be stored is not worth an error */
    }
}
