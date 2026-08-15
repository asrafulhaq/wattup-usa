/**
 * Re-uploads all local assets (public/assets) to a NEW Cloudinary account,
 * preserving the exact public IDs referenced in the code — so no code or DB
 * content needs to change beyond the cloud name.
 *
 * Usage:
 *   NEW_CLOUD_NAME=xxx NEW_API_KEY=yyy NEW_API_SECRET=zzz node scripts/migrate-cloudinary.mjs [--dry-run]
 */
import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';

const { NEW_CLOUD_NAME, NEW_API_KEY, NEW_API_SECRET } = process.env;
const dryRun = process.argv.includes('--dry-run');

if (!dryRun && (!NEW_CLOUD_NAME || !NEW_API_KEY || !NEW_API_SECRET)) {
    console.error(
        'Set NEW_CLOUD_NAME, NEW_API_KEY and NEW_API_SECRET env vars (or use --dry-run).'
    );
    process.exit(1);
}

cloudinary.config({
    cloud_name: NEW_CLOUD_NAME,
    api_key: NEW_API_KEY,
    api_secret: NEW_API_SECRET,
});

// ── 1. Collect every Cloudinary public ID referenced in the source ──────────
// IDs look like "some-name_ab12cd" — a slug plus a 6-char suffix Cloudinary
// added on the original upload.
const ID_PATTERN = /['"`]([A-Za-z0-9][A-Za-z0-9_-]*_[a-z0-9]{6})['"`]/g;
const SOURCE_DIRS = ['lib', 'components', 'app'];
const SOURCE_FILES = ['data.tsx'];

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(p);
        else if (/\.(ts|tsx)$/.test(entry.name)) yield p;
    }
}

const ids = new Set();
const sources = SOURCE_FILES.filter(f => fs.existsSync(f));
for (const dir of SOURCE_DIRS) for (const f of walk(dir)) sources.push(f);
for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(ID_PATTERN)) ids.add(m[1]);
}

// ── 2. Index local asset files by basename (without extension) ──────────────
const ASSET_ROOT = 'public/assets';
const localByBase = new Map();
for (const entry of walkAssets(ASSET_ROOT)) {
    const base = path.basename(entry, path.extname(entry));
    if (!localByBase.has(base)) localByBase.set(base, entry);
}
function* walkAssets(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walkAssets(p);
        else if (!entry.name.startsWith('.')) yield p;
    }
}

// ── 3. Match IDs to local files and upload ──────────────────────────────────
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const matched = [];
const missing = [];
for (const id of [...ids].sort()) {
    const prefix = id.slice(0, id.lastIndexOf('_'));
    const file = localByBase.get(prefix);
    if (file) matched.push({ id, file });
    else missing.push(id);
}

console.log(`Public IDs found in code : ${ids.size}`);
console.log(`Matched to local files   : ${matched.length}`);
console.log(`No local file found      : ${missing.length}`);
if (missing.length) {
    console.log('\nIDs with no local file (need manual recovery):');
    for (const id of missing) console.log('  -', id);
}

if (dryRun) {
    console.log('\nDry run — nothing uploaded.');
    process.exit(0);
}

let ok = 0;
let failed = 0;
for (const { id, file } of matched) {
    const isVideo = VIDEO_EXT.test(file);
    try {
        await cloudinary.uploader.upload(file, {
            public_id: id,
            resource_type: isVideo ? 'video' : 'image',
            overwrite: false,
            // large videos need the chunked endpoint
            ...(isVideo ? { chunk_size: 6_000_000 } : {}),
        });
        ok++;
        console.log(`✓ ${id}`);
    } catch (err) {
        failed++;
        console.error(`✗ ${id}: ${err.message}`);
    }
}
console.log(`\nDone. Uploaded: ${ok}, failed: ${failed}, missing: ${missing.length}`);
