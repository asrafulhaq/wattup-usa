import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The dashboard shell prerenders something, not nothing.
 *
 * components/dashboard/dashbaord-wrapper.tsx has two Suspense boundaries that await the
 * session. Both fell back to `null`, and the one wrapping the route's children is the
 * OUTERMOST pending boundary on a hard load, so React rendered that null and every
 * route's loading.tsx, one level deeper, never became HTML. Measured on a production
 * build: /dashboard/users prerendered as 8 778 bytes whose only visible text was the
 * <title>, with zero animate-pulse in it, and the first meaningful paint waited about
 * 560 ms locally for two database round trips.
 *
 * A `fallback={null}` is the kind of thing that comes back in a refactor with no test
 * failing, because nothing about it is wrong except that the viewer sees a blank page.
 * So this test reads the source. It is structural on purpose: what the fallbacks draw is
 * a design question, but that they draw SOMETHING is not.
 */

const WRAPPER = path.join(
    process.cwd(),
    'components',
    'dashboard',
    'dashbaord-wrapper.tsx'
);

describe('the dashboard shell has real Suspense fallbacks', () => {
    const source = readFileSync(WRAPPER, 'utf8');

    it('finds the wrapper at all, so a rename cannot make this test vacuous', () => {
        expect(source).toContain('SidebarProvider');
        expect(source).toContain('RequireSession');
    });

    it('has no fallback={null} left anywhere in it', () => {
        expect(/fallback=\{null\}/.test(source)).toBe(false);
    });

    it('falls back to the sidebar skeleton, not to nothing', () => {
        expect(source).toContain('<SidebarSkeleton />');
        expect(source).toContain("from '@/components/dashboard/ui/sidebar-skeleton'");
    });

    it('falls back to a page-shaped skeleton around the session gate, not to nothing', () => {
        expect(source).toContain('<DashboardBodySkeleton />');
        expect(source).toContain("from '@/components/dashboard/ui/page-skeletons'");
    });

    it('every Suspense in the shell has a fallback with markup in it', () => {
        const fallbacks = [...source.matchAll(/fallback=\{([\s\S]*?)\}>/g)].map(m => m[1]);
        expect(fallbacks.length).toBeGreaterThanOrEqual(3);
        for (const fallback of fallbacks) {
            expect(fallback.trim().startsWith('<'), `bare fallback: ${fallback.trim()}`).toBe(
                true
            );
        }
    });
});

/**
 * Both fallbacks must stay free of anything that reads the request, or Next cannot
 * prerender them into the static shell and the whole change is undone silently.
 */
describe('the fallbacks are prerenderable', () => {
    const files = [
        path.join(process.cwd(), 'components', 'dashboard', 'ui', 'sidebar-skeleton.tsx'),
        path.join(process.cwd(), 'components', 'dashboard', 'ui', 'page-skeletons.tsx'),
    ];

    it.each(files.map(f => [path.basename(f), f]))(
        '%s reads no session, no headers and no cookies',
        (name, file) => {
            const source = readFileSync(file, 'utf8');
            for (const forbidden of [
                'getSession',
                'getSessionPermissions',
                'requirePermission',
                'next/headers',
                'hasPermission',
            ]) {
                expect(source.includes(forbidden), `${name} reads ${forbidden}`).toBe(false);
            }
        }
    );
});
