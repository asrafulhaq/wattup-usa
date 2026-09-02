#!/usr/bin/env node
/**
 * The shared-surface migration guard. Checklist 4b.11, root CLAUDE.md.
 *
 * wattup-frontend owns the schema, but three surfaces are read by
 * wattup-proforma through Postgres alone: the `user` table, the
 * `activity_log` table, and every `proforma_*` table and the `proforma_member`
 * view. A migration that touches one of them changes the other app without
 * touching its code, so it must say so where a reviewer will read it.
 *
 * The rule: every new or changed prisma/migrations/<name>/migration.sql whose
 * SQL (comments stripped) mentions `"user"`, `activity_log` or `proforma_`
 * must carry a line matching
 *
 *     -- shared-surface: <what changes for wattup-proforma, in one line>
 *
 * or this script exits 1 naming the file. Plain Node, no dependencies, so CI
 * and a pre-push hook can both run it before anything is installed.
 *
 * Usage, from anywhere:
 *
 *     node scripts/check-shared-migrations.mjs                 diff against origin/main
 *     node scripts/check-shared-migrations.mjs --base main     diff against another ref
 *     node scripts/check-shared-migrations.mjs main            same, positional
 *     node scripts/check-shared-migrations.mjs --all           every migration, no git
 *     node scripts/check-shared-migrations.mjs --dir <path>    another migrations directory
 *
 * "New or changed" is the union of `git diff --name-only <base>...HEAD`, the
 * working tree's tracked changes, and untracked files, so the guard sees a
 * migration before it is committed as well as in CI. When the base ref does
 * not resolve (a fresh clone without origin/main, a push with no base) the
 * guard falls back to scanning every migration and says so.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HEADER = /^-- shared-surface: .+/m;
const SHARED = /"user"|activity_log|proforma_/i;
const DEFAULT_BASE = 'origin/main';
const REQUIRED_FORMAT = '-- shared-surface: <which shared table or view changes, and what wattup-proforma must do about it>';

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.resolve(here, '..', 'prisma', 'migrations');

function usage(code) {
    process.stdout.write(
        [
            'usage: node scripts/check-shared-migrations.mjs [--base <ref> | <ref>] [--all] [--dir <migrations dir>]',
            '',
            `  default base: ${DEFAULT_BASE}; falls back to --all when the base does not resolve`,
            '',
        ].join('\n'),
    );
    process.exit(code);
}

function parseArgs(argv) {
    const options = { base: undefined, all: false, dir: DEFAULT_DIR };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') usage(0);
        else if (arg === '--all') options.all = true;
        else if (arg === '--base') options.base = argv[(i += 1)];
        else if (arg.startsWith('--base=')) options.base = arg.slice('--base='.length);
        else if (arg === '--dir') options.dir = path.resolve(argv[(i += 1)]);
        else if (arg.startsWith('--dir=')) options.dir = path.resolve(arg.slice('--dir='.length));
        else if (arg.startsWith('-')) {
            process.stderr.write(`unknown option ${arg}\n`);
            usage(2);
        } else if (options.base === undefined) options.base = arg;
        else {
            process.stderr.write(`unexpected argument ${arg}\n`);
            usage(2);
        }
    }
    if (options.base === '') {
        process.stderr.write('--base needs a ref\n');
        usage(2);
    }
    return options;
}

function git(cwd, args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function tryGit(cwd, args) {
    try {
        return git(cwd, args);
    } catch {
        return null;
    }
}

/** True for <migrations dir>/<name>/migration.sql and nothing else. */
function isMigrationSql(file, dir) {
    const relative = path.relative(dir, file);
    const parts = relative.split(path.sep);
    return parts.length === 2 && !parts[0].startsWith('..') && parts[1] === 'migration.sql';
}

function allMigrations(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .map((name) => path.join(dir, name, 'migration.sql'))
        .filter((file) => existsSync(file) && statSync(file).isFile())
        .sort();
}

/**
 * Migration files new or changed relative to `base`: committed (base...HEAD),
 * tracked but uncommitted (HEAD vs working tree), and untracked. Returns null
 * when git or the base is unavailable, which callers treat as "scan all".
 */
function changedMigrations(dir, base) {
    const top = tryGit(dir, ['rev-parse', '--show-toplevel']);
    if (top === null) return { files: null, reason: `${dir} is not inside a git repository` };
    const root = top.trim();
    if (tryGit(dir, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]) === null) {
        return { files: null, reason: `ref ${base} does not resolve` };
    }

    // Every git call below runs from the repository root: a pathspec is
    // resolved against the cwd, and `--name-only` prints root-relative paths,
    // so running from inside the migrations directory would match nothing and
    // report "nothing to check" for a branch full of new migrations.
    const listed = new Set();
    const spec = path.relative(root, dir) || '.';
    for (const args of [
        ['diff', '--name-only', '--diff-filter=AMR', `${base}...HEAD`, '--', spec],
        ['diff', '--name-only', '--diff-filter=AMR', 'HEAD', '--', spec],
        ['ls-files', '--others', '--exclude-standard', '--', spec],
    ]) {
        const out = tryGit(root, args);
        if (out === null) return { files: null, reason: `git ${args.slice(0, 2).join(' ')} failed for ${base}` };
        for (const line of out.split('\n')) {
            if (line.trim()) listed.add(path.resolve(root, line.trim()));
        }
    }

    return {
        files: [...listed].filter((file) => isMigrationSql(file, dir) && existsSync(file)).sort(),
        reason: null,
    };
}

/** The SQL with `-- ...` and `/* ... *\/` comments removed, so a mention inside a comment does not count. */
function stripComments(sql) {
    return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, '');
}

function check(file, dir) {
    const raw = readFileSync(file, 'utf8');
    const touchesShared = SHARED.test(stripComments(raw));
    const hasHeader = HEADER.test(raw);
    return { name: path.relative(dir, file), touchesShared, hasHeader, ok: !touchesShared || hasHeader };
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const dir = options.dir;

    let files;
    let mode;
    if (options.all) {
        files = allMigrations(dir);
        mode = 'every migration (--all)';
    } else {
        const base = options.base ?? DEFAULT_BASE;
        const changed = changedMigrations(dir, base);
        if (changed.files === null) {
            process.stdout.write(`shared-surface guard: ${changed.reason}; scanning every migration instead\n`);
            files = allMigrations(dir);
            mode = 'every migration (fallback)';
        } else {
            files = changed.files;
            mode = `migrations new or changed since ${base}`;
        }
    }

    process.stdout.write(`shared-surface guard: ${mode} in ${dir}\n`);
    if (files.length === 0) {
        process.stdout.write('shared-surface guard: nothing to check\n');
        return 0;
    }

    const results = files.map((file) => check(file, dir));
    for (const r of results) {
        const state = !r.touchesShared ? 'ok, no shared surface' : r.hasHeader ? 'ok, shared surface with header' : 'MISSING HEADER';
        process.stdout.write(`  ${r.ok ? ' ' : '!'} ${r.name}: ${state}\n`);
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
        process.stdout.write(`shared-surface guard: ${results.length} checked, all ok\n`);
        return 0;
    }

    process.stdout.write(
        [
            '',
            `shared-surface guard: ${failed.length} migration${failed.length === 1 ? '' : 's'} touch "user", activity_log or proforma_* without saying so:`,
            ...failed.map((r) => `  ${path.join(dir, r.name)}`),
            '',
            'wattup-proforma reads those tables and the proforma_member view through Postgres alone (root CLAUDE.md),',
            'so each of these files must carry a line, anywhere in the file, matching /^-- shared-surface: .+/ :',
            '',
            `  ${REQUIRED_FORMAT}`,
            '',
        ].join('\n'),
    );
    return 1;
}

process.exit(main());
