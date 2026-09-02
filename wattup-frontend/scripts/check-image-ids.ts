/**
 * Regression check for F18 (checklist B.16): every URL that lib/images/*.ts builds for
 * a marketing page must actually resolve, so a Cloudinary asset going missing (deleted,
 * renamed or overwritten in the console) is caught here instead of by a 404 on the site.
 *
 * Checks the *ImageUrls export of every module in lib/images/ — i.e. what the app
 * actually renders, not the raw public ids — so a key deliberately pointed at a local
 * public/ fallback (see lib/images/about.ts, corePrincipals) is verified the right way:
 * an HTTP HEAD for an absolute URL, a filesystem check for a root-relative path.
 *
 * Network only: no Cloudinary credentials are used and nothing is written anywhere.
 *
 * Run: pnpm exec tsx scripts/check-image-ids.ts
 * Exits 1 if any id fails to resolve.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IMAGES_DIR = join(__dirname, '..', 'lib', 'images');
const PUBLIC_DIR = join(__dirname, '..', 'public');

type Check = { file: string; map: string; key: string; url: string };

async function collectChecks(): Promise<Check[]> {
    const files = readdirSync(IMAGES_DIR)
        .filter((f) => f.endsWith('.ts'))
        .sort();
    const checks: Check[] = [];
    for (const file of files) {
        const mod = await import(join(IMAGES_DIR, file));
        for (const [name, value] of Object.entries(mod)) {
            if (!name.endsWith('Urls')) continue;
            if (typeof value !== 'object' || value === null) continue;
            for (const [key, url] of Object.entries(value as Record<string, unknown>)) {
                if (typeof url !== 'string') continue;
                checks.push({ file, map: name, key, url });
            }
        }
    }
    return checks;
}

async function headOk(url: string): Promise<{ ok: boolean; detail: string }> {
    try {
        const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'user-agent': 'Mozilla/5.0 check-image-ids' },
            redirect: 'follow',
        });
        return { ok: res.status === 200, detail: `HTTP ${res.status}` };
    } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
}

function localFileOk(pathname: string): { ok: boolean; detail: string } {
    const ok = existsSync(join(PUBLIC_DIR, pathname));
    return { ok, detail: ok ? 'found in public/' : `not found under ${PUBLIC_DIR}` };
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
    const out: R[] = new Array(items.length);
    let i = 0;
    await Promise.all(
        Array.from({ length: n }, async () => {
            while (i < items.length) {
                const k = i++;
                out[k] = await fn(items[k]);
            }
        }),
    );
    return out;
}

async function main() {
    const checks = await collectChecks();
    console.log(`Checking ${checks.length} image/video URLs across ${new Set(checks.map((c) => c.file)).size} lib/images/ modules...`);

    const results = await pool(checks, 8, async (c) => {
        const isLocal = c.url.startsWith('/');
        const result = isLocal ? localFileOk(c.url) : await headOk(c.url);
        return { ...c, ...result };
    });

    const failures = results.filter((r) => !r.ok);
    for (const r of failures) {
        console.error(`FAIL  ${r.file}:${r.map}.${r.key}  ${r.url}  (${r.detail})`);
    }

    console.log(`\n${results.length - failures.length}/${results.length} ok, ${failures.length} failing`);
    if (failures.length > 0) {
        console.error(
            '\nKnown as of F18 (docs/plan/SECURITY-FINDINGS.md): seven ids in lib/images/home.ts ' +
                '(hero1, hero2, hero2Md, homepageHero1, slide_1_full, slide_2_full, slide_3_full) are ' +
                'gone from the Cloudinary account, unused by any page, and left unresolved rather than ' +
                'guessed at — see the `// MISSING (F18)` comments in that file. Any other failure here is ' +
                'new and should be investigated before merging.',
        );
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
