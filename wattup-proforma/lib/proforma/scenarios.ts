/**
 * Saved scenarios, and the last session's working state.
 *
 * The static tool declared localStorage keys and then never used them: `safeGet`
 * and `safeSet` read and wrote a plain object, so every scenario died with the tab.
 * By owner decision (docs/plan/PROFORMA-NEXTJS-MIGRATION.md section 2.2) they now
 * persist for real, under those same key names.
 *
 * That means a landlord's deal terms are written to the device, which is why
 * `clearAll` exists and why the panel gives it a visible control rather than
 * burying it. Everything here fails soft: a browser with storage disabled, a full
 * quota or a private window degrades to in-session behaviour, which is exactly what
 * the tool did before, rather than throwing on a keystroke.
 */
import type { ProformaInputs } from './model';
import type { GalleryItem, ImageSlots } from './state';

export const LS_KEY = 'wattup_proforma_scenarios_v1';
export const LS_LAST = 'wattup_proforma_last_v1';

export interface LastSession {
    inputs: ProformaInputs;
    images: ImageSlots;
    gallery: GalleryItem[];
}

export type ScenarioMap = Record<string, ProformaInputs>;

/**
 * Reading localStorage throws outright in some configurations, not merely returns
 * null, so every access is guarded. A failure is never worth breaking a keystroke.
 */
function store(): Storage | null {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage;
    } catch {
        return null;
    }
}

function readJson<T>(key: string): T | null {
    const s = store();
    if (!s) return null;
    try {
        const raw = s.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

/** Returns false when the write did not stick, so callers can tell the user. */
function writeJson(key: string, value: unknown): boolean {
    const s = store();
    if (!s) return false;
    try {
        s.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function isStorageAvailable(): boolean {
    const s = store();
    if (!s) return false;
    try {
        const probe = '__wattup_probe__';
        s.setItem(probe, '1');
        s.removeItem(probe);
        return true;
    } catch {
        return false;
    }
}

/* ---------------- the working state ---------------- */

export function persistLast(session: LastSession): void {
    writeJson(LS_LAST, session);
}

export function restoreLast(): LastSession | null {
    const j = readJson<Partial<LastSession>>(LS_LAST);
    if (!j || !j.inputs) return null;
    return {
        inputs: j.inputs,
        images: j.images ?? { cover: null, aerial: null, design: null },
        gallery: Array.isArray(j.gallery) ? j.gallery : [],
    };
}

export function clearLast(): void {
    try {
        store()?.removeItem(LS_LAST);
    } catch {
        /* nothing to do: the state is already gone or was never there */
    }
}

/* ---------------- named scenarios ---------------- */

export function readScenarios(): ScenarioMap {
    return readJson<ScenarioMap>(LS_KEY) ?? {};
}

export function saveScenario(name: string, inputs: ProformaInputs): boolean {
    const all = readScenarios();
    all[name] = inputs;
    return writeJson(LS_KEY, all);
}

export function deleteScenario(name: string): boolean {
    const all = readScenarios();
    delete all[name];
    return writeJson(LS_KEY, all);
}

export function scenarioNames(): string[] {
    return Object.keys(readScenarios());
}

/**
 * Remove everything this tool has written to the device: saved scenarios and the
 * restored working state, images and all. The visible half of the decision to
 * persist at all.
 */
export function clearAll(): void {
    try {
        const s = store();
        s?.removeItem(LS_KEY);
        s?.removeItem(LS_LAST);
    } catch {
        /* already unreachable, which is the outcome we wanted */
    }
}
