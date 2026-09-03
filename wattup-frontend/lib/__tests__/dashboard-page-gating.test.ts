import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Every dashboard page checks a permission, proven by walking the folder rather than by
 * anybody remembering to.
 *
 * The client's requirement is that nobody sees what they do not have access to, and the
 * sidebar half of that is easy to keep: it is one file. The pages are the half that
 * decays, because a new one is added in a different folder by somebody who is thinking
 * about the feature rather than about access. Two pages had already slipped through when
 * this test was written: the article editor opened for anyone signed in, so a role
 * without CREATE_POST could fill in a whole press release and only then be refused by
 * the action behind the Save button.
 *
 * The check is deliberately structural, not clever: a page must resolve the caller's
 * permissions and refuse somebody. What it refuses them for is the page's business.
 */

const DASHBOARD = path.join(process.cwd(), 'app', '(dashboard)');

/** Every page.tsx under app/(dashboard), as paths relative to the app root. */
function dashboardPages(dir: string = DASHBOARD, found: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) dashboardPages(full, found);
        else if (entry === 'page.tsx') found.push(full);
    }
    return found;
}

/**
 * Pages that legitimately ask for no permission, each with the reason. A page may only
 * be here because it is scoped to the caller's own account: "everyone can see it" is not
 * a reason, it is the thing this test exists to catch.
 */
const SELF_SCOPED: Record<string, string> = {
    'dashboard/profile/page.tsx':
        'Your own profile and your own access. Every person has one, and it shows nobody else anything.',
};

const relative = (file: string) => path.relative(DASHBOARD, file).split(path.sep).join('/');

describe('every dashboard page is permission gated', () => {
    const pages = dashboardPages();

    it('finds the pages at all, so a rename cannot make this test vacuous', () => {
        expect(pages.length).toBeGreaterThanOrEqual(10);
    });

    it.each(dashboardPages().map(file => [relative(file), file]))(
        '%s resolves the caller permissions and refuses somebody',
        (name, file) => {
            if (name in SELF_SCOPED) return;
            const source = readFileSync(file, 'utf8');

            // Resolves what the caller may do...
            expect(
                /getSessionPermissions|requirePermission/.test(source),
                `${name} never resolves the caller's permissions`
            ).toBe(true);

            // ...and does something with the answer. A page that resolves permissions and
            // then renders regardless is the same hole with extra steps.
            expect(
                /NoAccess|notFound\(\)|hasPermission\(/.test(source),
                `${name} resolves permissions but refuses nobody`
            ).toBe(true);
        }
    );

    it('the self-scoped list is exactly what it claims, and every entry still exists', () => {
        const all = new Set(pages.map(relative));
        for (const name of Object.keys(SELF_SCOPED)) {
            expect(all.has(name), `${name} is listed as self scoped but no longer exists`).toBe(true);
            expect(SELF_SCOPED[name].length).toBeGreaterThan(30);
        }
    });
});
