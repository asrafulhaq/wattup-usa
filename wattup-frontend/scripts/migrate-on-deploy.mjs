#!/usr/bin/env node
/**
 * Apply pending migrations, but only on a production deploy.
 *
 * Runs from the `build` script, ahead of `next build`.
 *
 * WHY THE GUARD EXISTS, and why it is not optional. This repository has ONE
 * database: `wattup-frontend` and `wattup-proforma` share it, and there is no
 * preview or branch database configured. Without the guard, every Preview
 * deployment would migrate PRODUCTION, so opening a pull request with a bad
 * migration would alter live data before anyone had reviewed it.
 *
 * WHAT MAKES THIS SAFE, and it is a rule rather than a mechanism: **migrations
 * must be additive.** Vercel runs the build BEFORE it promotes the deployment, so
 * a migration lands while the previous version is still serving traffic. Adding a
 * column or a table is invisible to that older code. Dropping or renaming one
 * breaks the running site for the length of the build. Split a destructive change
 * across two releases: add the new shape and start writing to it, ship, then
 * remove the old shape in a later release once nothing reads it.
 *
 * `prisma migrate deploy` never resets and never generates; it applies what is
 * pending and stops. It takes an advisory lock, so two concurrent production
 * builds cannot race each other.
 *
 * A failure here fails the build on purpose. Deploying code whose schema change
 * did not apply is worse than not deploying.
 *
 * NOT for the first deploy against an empty database, and not for the seed, which
 * stays a deliberate one-off (see docs/plan/RUNBOOK-DEPLOY.md).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const env = process.env.VERCEL_ENV;

if (env !== 'production') {
    const where = env ? `VERCEL_ENV=${env}` : 'not a Vercel build';
    console.log(`[migrate-on-deploy] skipped: ${where}. Migrations run on production deploys only.`);
    process.exit(0);
}

if (!process.env.DATABASE_URL?.trim()) {
    console.error('[migrate-on-deploy] DATABASE_URL is missing on a production build. Refusing to continue.');
    process.exit(1);
}

console.log('[migrate-on-deploy] production deploy: applying pending migrations');

/*
 * Resolve the binary rather than trusting PATH. A package manager puts
 * node_modules/.bin on PATH for its own scripts, but this file is also run
 * directly (and was, while being tested, where bare `prisma` gave ENOENT and the
 * build would have continued as if migrations had run).
 */
const local = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);
const prisma = existsSync(local) ? local : 'prisma';

const result = spawnSync(prisma, ['migrate', 'deploy'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
});

if (result.error) {
    console.error('[migrate-on-deploy] could not run prisma:', result.error.message);
    process.exit(1);
}

// Fail the build rather than ship code whose schema change did not land.
process.exit(result.status ?? 1);
