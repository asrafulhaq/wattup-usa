/**
 * The proxy in front of /tool.
 *
 * Every case here exists because of a bug that actually happened. The proxy asked
 * better-auth for the session cookie without naming the prefix; lib/auth.ts renames
 * these cookies to 'wup' so the two apps cannot collide; better-auth looked for its
 * own default, found nothing, and turned away every signed-in member. /login then
 * saw a valid member and sent them back to /tool. An infinite redirect loop that
 * typechecked, linted, built, and passed every test.
 *
 * So the first test below is the one that matters: a real cookie must get through.
 */
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { COOKIE_PREFIX } from '@/lib/auth-cookies';
import { proxy } from '@/proxy';

const SITE = 'http://localhost:3001';

function request(path: string, cookie?: string) {
    return new NextRequest(new URL(path, SITE), {
        headers: cookie ? { cookie } : {},
    });
}

describe('the /tool proxy', () => {
    it('lets a session cookie through, under THIS app’s prefix', () => {
        const res = proxy(request('/tool', `${COOKIE_PREFIX}.session_token=a-token`));
        expect(res.status).toBe(200);
        expect(res.headers.get('location')).toBeNull();
    });

    it('lets the production __Secure- form through too', () => {
        const res = proxy(request('/tool', `__Secure-${COOKIE_PREFIX}.session_token=a-token`));
        expect(res.status).toBe(200);
    });

    it('turns away a request with no cookie at all', () => {
        const res = proxy(request('/tool'));
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe(`${SITE}/login?next=%2Ftool`);
    });

    it('turns away a cookie jar that carries no session', () => {
        const res = proxy(request('/tool', 'theme=dark; other=1'));
        expect(res.status).toBe(307);
    });

    /**
     * The dashboard's cookie must NOT be accepted here. The two apps share a parent
     * domain in production, so a wattupusa.com session would otherwise arrive on
     * this request and look like one of ours.
     */
    it('does not accept better-auth’s default prefix, which is the dashboard’s', () => {
        const res = proxy(request('/tool', 'better-auth.session_token=someone-elses'));
        expect(res.status).toBe(307);
    });

    it('sends the caller somewhere same-site, through safeNext', () => {
        const res = proxy(request('/tool'));
        const location = new URL(res.headers.get('location')!);
        expect(location.origin).toBe(SITE);
        expect(location.searchParams.get('next')).toBe('/tool');
    });

    it('is not the membership check: it cannot tell a valid token from a forged one', () => {
        // Recorded deliberately. app/tool/page.tsx re-checks against the database,
        // and this passing is exactly why that check may never be removed.
        const forged = proxy(request('/tool', `${COOKIE_PREFIX}.session_token=obviously-fake`));
        expect(forged.status).toBe(200);
    });
});
