import { describe, expect, it } from 'vitest';

import { safeNext as reexported } from '@/lib/gate';
import { safeNext } from '@/lib/safe-next';

/**
 * safeNext: the one definition of "a same-site path", shared by the tool
 * route (producer), verify-code (server consumer) and the login form (browser
 * consumer). Checklist 2.23: the gate cannot be an open redirect.
 */

const ORIGIN = 'https://hostproposal.test';

const attacks: [raw: string | null | undefined, why: string][] = [
    ['/\t/evil.com', 'a tab: the URL parser strips it and reads //evil.com'],
    ['/\n/evil.com', 'a newline, stripped the same way'],
    ['/\r/evil.com', 'a carriage return'],
    ['/\t\\evil.com', 'a tab then a backslash'],
    ['/\u007f/evil.com', 'DEL'],
    ['//evil.com', 'protocol-relative'],
    ['/\\evil.com', 'a backslash, which browsers read as a second slash'],
    ['\\/evil.com', 'a leading backslash'],
    ['javascript:alert(1)', 'a scheme'],
    ['http://evil.com', 'an absolute URL'],
    ['https://evil.com/tool/', 'an absolute URL that ends in the tool path'],
    ['', 'empty'],
    [null, 'null'],
    [undefined, 'undefined'],
    ['evil.com', 'no leading slash'],
    ['tool/', 'a relative path'],
];

describe('safeNext', () => {
    it.each(attacks)('%j -> /tool/ (%s)', (raw) => {
        expect(safeNext(raw)).toBe('/tool/');
    });

    it.each([['/tool/?x=1'], ['/tool/js/model.js'], ['/tool/'], ['/login?next=%2Ftool%2F']])(
        'keeps a legitimate same-site path literally: %j',
        (raw) => {
            expect(safeNext(raw)).toBe(raw);
        },
    );

    it('/%2f%2fevil.com is a same-site path, not a redirect: the parser does not decode before resolving', () => {
        const out = safeNext('/%2f%2fevil.com');

        expect(out).toBe('/%2f%2fevil.com');
        expect(new URL(out, ORIGIN).origin).toBe(ORIGIN);
    });

    it('whatever it returns resolves on this origin, for every payload above', () => {
        for (const [raw] of [...attacks, ['/%2f%2fevil.com', ''] as const, ['/tool/?x=1', ''] as const]) {
            const out = safeNext(raw);
            expect(out.startsWith('/'), JSON.stringify(raw)).toBe(true);
            expect(new URL(out, ORIGIN).origin, JSON.stringify(raw)).toBe(ORIGIN);
        }
    });

    it('drops a fragment: the browser never sends it, so a redirect target never carries one', () => {
        expect(safeNext('/tool/?x=1#frag')).toBe('/tool/?x=1');
    });

    it('is the same function lib/gate.ts re-exports, so the server consumers cannot drift from the browser one', () => {
        expect(reexported).toBe(safeNext);
    });
});
