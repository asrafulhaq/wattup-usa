/**
 * The brand assets the document draws, as data URLs.
 *
 * Data URLs, not `<img src="/proforma/...">`, and the reason is load-bearing: the
 * document is rendered into a srcdoc iframe, printed to PDF, and exported as a
 * standalone .html blob that a landlord opens on their own machine. An external
 * URL survives none of the last two. The static tool made the same choice and said
 * so; this keeps it.
 *
 * What changed is the timing. `boot()` awaited three fetches ONE AFTER ANOTHER
 * before it drew anything at all, so the whole panel waited on 234 KB of images it
 * did not need in order to render a form. Here they load in parallel, the panel is
 * interactive immediately, and only the preview waits.
 */
import type { ProformaAssets } from './document';

const BASE = '/proforma';

export const ASSET_URLS = {
    logo_type_light: `${BASE}/logo_type_light.svg`,
    mark_dark: `${BASE}/mark_dark.svg`,
    cover_default: `${BASE}/render-station-wide.jpg`,
} as const;

/**
 * Read an SVG as text and base64 it, rather than going through a blob. `btoa`
 * rejects anything outside Latin-1, and these files carry real UTF-8, so the
 * encodeURIComponent/unescape pair widens the characters first. Straight from the
 * static tool's svgDataUrl.
 */
async function svgDataUrl(path: string): Promise<string> {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${r.status} for ${path}`);
    const txt = await r.text();
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(txt)))}`;
}

/** Any raster: fetch, then let FileReader produce the data URL with its mime type. */
async function rasterDataUrl(path: string): Promise<string> {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${r.status} for ${path}`);
    const blob = await r.blob();
    return new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(new Error(`could not read ${path}`));
        fr.readAsDataURL(blob);
    });
}

/**
 * Load all three at once.
 *
 * A failure falls back to the plain path, exactly as the static tool did: inside a
 * srcdoc frame a same-origin path still resolves in the preview, so a blocked
 * fetch costs the printed copy its logo rather than costing the user their screen.
 */
export async function loadAssets(): Promise<ProformaAssets> {
    const settle = async (fn: () => Promise<string>, fallback: string) => {
        try {
            return await fn();
        } catch {
            return fallback;
        }
    };

    const [logo_type_light, mark_dark, cover_default] = await Promise.all([
        settle(() => svgDataUrl(ASSET_URLS.logo_type_light), ASSET_URLS.logo_type_light),
        settle(() => svgDataUrl(ASSET_URLS.mark_dark), ASSET_URLS.mark_dark),
        settle(() => rasterDataUrl(ASSET_URLS.cover_default), ASSET_URLS.cover_default),
    ]);

    return { logo_type_light, mark_dark, cover_default };
}

/** Turn a picked or dropped File into the data URL the document embeds. */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(new Error('could not read that file'));
        fr.readAsDataURL(file);
    });
}
