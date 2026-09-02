import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/gate/request-code/route';
import { checkEmailLimits, checkIpLimit } from '@/lib/rate-limit';

import { gatePost, observable } from '../helpers';
import { auth } from '../mocks/auth';
import { directory, member } from '../mocks/member-directory';
import { runAfterCallbacks, scheduledAfterCount } from '../mocks/next-server';
import { prisma } from '../mocks/prisma';

/**
 * POST /api/gate/request-code. Checklist 5.11, ADR 0001 section 7.
 *
 * The property: the response is produced from the request alone. Nothing that
 * depends on WHO asked (the directory, the limiter, Better Auth, the send) runs
 * until after() fires, and after() fires once the response has gone out. So a
 * member and a non-member get the same bytes, in the same time, and the only
 * way to tell them apart is to have the inbox.
 *
 * The limiter's own logic is tests/lib/rate-limit.test.ts; here it is a mock
 * whose answer the test scripts, so what is under test is the route's order of
 * operations, not the counters. The same goes for the audit row (checklist
 * 4b.5): lib/activity-log.ts is tests/lib/activity-log.test.ts; here the
 * questions are WHEN it is written (after the response, never before) and
 * WHAT it says for each way the decision can go.
 */

vi.mock('@/lib/rate-limit', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
    return { ...actual, checkIpLimit: vi.fn(), checkEmailLimits: vi.fn() };
});

const PATH = '/api/gate/request-code';
const MEMBER = 'member@hostproposal.test';
const STRANGER = 'stranger@hostproposal.test';
const GENERIC_BODY = JSON.stringify({ message: 'If that address is on the team list, a code is on its way.' });
const GENERIC_HEADER_NAMES = ['cache-control', 'content-type', 'x-correlation-id', 'x-robots-tag'];

beforeEach(() => {
    vi.mocked(checkIpLimit).mockReset().mockResolvedValue({ allowed: true });
    vi.mocked(checkEmailLimits).mockReset().mockResolvedValue({ allowed: true });
    directory.lookup.mockImplementation(async (email) => (email === MEMBER ? member(MEMBER) : null));
});

/** Nothing that turns on the address has run. Asserted at the moment the response exists. */
function expectNothingDecidedYet(): void {
    expect(checkIpLimit).not.toHaveBeenCalled();
    expect(directory.lookup).not.toHaveBeenCalled();
    expect(checkEmailLimits).not.toHaveBeenCalled();
    expect(auth.api.sendVerificationOTP).not.toHaveBeenCalled();
    // The audit row is a database write; on the response path it would be
    // both a delay and, if it failed, a different answer (checklist 4b.5).
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
}

/** The one activity_log row the drained after() left, or a failure if there was not exactly one. */
function theRow() {
    expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
    return prisma.activityLog.create.mock.calls[0]![0].data;
}

const CLIENT = { 'x-forwarded-for': '198.51.100.9, 10.0.0.1', 'user-agent': 'vitest/1.0' };

describe('enumeration: the response does not depend on the address', () => {
    const requests: [label: string, make: () => Request, schedulesWork: boolean][] = [
        ['a member', () => gatePost(PATH, { body: { email: MEMBER } }), true],
        ['a non-member', () => gatePost(PATH, { body: { email: STRANGER } }), true],
        ['a body that is not JSON', () => gatePost(PATH, { rawBody: `email=${MEMBER}` }), false],
        ['an email that is not a string', () => gatePost(PATH, { body: { email: [MEMBER] } }), false],
        ['no content-type', () => gatePost(PATH, { body: { email: MEMBER }, contentType: null }), false],
    ];

    it('answers all five with the same status, the same body bytes and the same header names, before anything has looked at the address', async () => {
        const seen: { label: string; scheduled: number; status: number; body: string; headers: [string, string][] }[] = [];

        for (const [label, make] of requests) {
            const before = scheduledAfterCount();
            const response = await POST(make());
            // The response exists and the decision has not started: that is the
            // whole timing argument (checklist 2.42).
            expectNothingDecidedYet();
            const { status, body, headerNames, headers } = await observable(response);
            expect(headerNames, label).toEqual(GENERIC_HEADER_NAMES);
            seen.push({ label, scheduled: scheduledAfterCount() - before, status, body, headers });
        }

        const [first, ...rest] = seen;
        expect(first.status).toBe(200);
        expect(first.body).toBe(GENERIC_BODY);
        for (const other of rest) {
            expect({ status: other.status, body: other.body, headers: other.headers }, other.label).toEqual({
                status: first.status,
                body: first.body,
                headers: first.headers,
            });
        }

        // What after() was handed is server-internal and invisible to the
        // caller: a well-formed request schedules exactly one decision, a
        // malformed one schedules nothing, and neither changes the response.
        expect(seen.map(({ label, scheduled }) => [label, scheduled])).toEqual(
            requests.map(([label, , schedulesWork]) => [label, schedulesWork ? 1 : 0]),
        );
    });

    it('sends a code to the member only, and only once the response has gone out', async () => {
        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await POST(gatePost(PATH, { body: { email: STRANGER } }));
        expectNothingDecidedYet();

        await runAfterCallbacks();

        expect(directory.lookup).toHaveBeenCalledTimes(2);
        expect(directory.lookup).toHaveBeenNthCalledWith(1, MEMBER);
        expect(directory.lookup).toHaveBeenNthCalledWith(2, STRANGER);
        expect(auth.api.sendVerificationOTP).toHaveBeenCalledTimes(1);
        expect(auth.api.sendVerificationOTP).toHaveBeenCalledWith({ body: { email: MEMBER, type: 'sign-in' } });
    });

    it('normalises the address (trim, lowercase) before the directory or Better Auth see it', async () => {
        await POST(gatePost(PATH, { body: { email: '  Member@HostProposal.TEST ' } }));
        await runAfterCallbacks();

        expect(directory.lookup).toHaveBeenCalledWith(MEMBER);
        expect(auth.api.sendVerificationOTP).toHaveBeenCalledWith({ body: { email: MEMBER, type: 'sign-in' } });
    });

    it('sends nothing to an address the directory lists as inactive', async () => {
        directory.lookup.mockResolvedValue(member(MEMBER, { active: false }));

        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await runAfterCallbacks();

        expect(auth.api.sendVerificationOTP).not.toHaveBeenCalled();
    });

    it('swallows a Better Auth failure inside after(): nothing reaches the caller, and nothing throws', async () => {
        auth.api.sendVerificationOTP.mockRejectedValue(new Error('database gone'));

        const response = await POST(gatePost(PATH, { body: { email: MEMBER } }));
        expect((await observable(response)).body).toBe(GENERIC_BODY);
        await expect(runAfterCallbacks()).resolves.toBeUndefined();
    });
});

describe('the limiter, from inside after() (checklist 5.5, 5.7a)', () => {
    it('hits the IP counter before the directory, so a probe for a non-member counts', async () => {
        await POST(
            gatePost(PATH, {
                body: { email: STRANGER },
                headers: { 'x-forwarded-for': '198.51.100.9, 10.0.0.1' },
            }),
        );
        await runAfterCallbacks();

        expect(checkIpLimit).toHaveBeenCalledTimes(1);
        expect(checkIpLimit).toHaveBeenCalledWith('198.51.100.9');
        expect(vi.mocked(checkIpLimit).mock.invocationCallOrder[0]).toBeLessThan(directory.lookup.mock.invocationCallOrder[0]);
        // A non-member is never counted against the address.
        expect(checkEmailLimits).not.toHaveBeenCalled();
    });

    it('hits the address counters after the directory, for a member only, then Better Auth', async () => {
        await POST(gatePost(PATH, { body: { email: MEMBER }, headers: { 'x-forwarded-for': '198.51.100.9' } }));
        await runAfterCallbacks();

        expect(checkEmailLimits).toHaveBeenCalledWith(MEMBER, '198.51.100.9');
        const order = [
            vi.mocked(checkIpLimit).mock.invocationCallOrder[0],
            directory.lookup.mock.invocationCallOrder[0],
            vi.mocked(checkEmailLimits).mock.invocationCallOrder[0],
            auth.api.sendVerificationOTP.mock.invocationCallOrder[0],
        ];
        expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it('refused by the IP limit: the same 200, no directory lookup, nothing sent', async () => {
        vi.mocked(checkIpLimit).mockResolvedValue({ allowed: false, reason: 'ip' });

        const response = await POST(gatePost(PATH, { body: { email: MEMBER } }));
        expect((await observable(response)).body).toBe(GENERIC_BODY);
        await runAfterCallbacks();

        expect(directory.lookup).not.toHaveBeenCalled();
        expect(auth.api.sendVerificationOTP).not.toHaveBeenCalled();
    });

    it('refused by the address limits: the same 200, nothing sent', async () => {
        vi.mocked(checkEmailLimits).mockResolvedValue({ allowed: false, reason: 'gap' });

        const response = await POST(gatePost(PATH, { body: { email: MEMBER } }));
        expect((await observable(response)).body).toBe(GENERIC_BODY);
        await runAfterCallbacks();

        expect(auth.api.sendVerificationOTP).not.toHaveBeenCalled();
    });
});

describe('the audit row (checklist 4b.5, 4b.7): one per decision, written last, inside after()', () => {
    it('a member: code.requested with their user id, the client address, the user agent and the correlation id the caller received', async () => {
        const response = await POST(gatePost(PATH, { body: { email: MEMBER }, headers: CLIENT }));
        const id = response.headers.get('x-correlation-id');
        expect(prisma.activityLog.create).not.toHaveBeenCalled();

        await runAfterCallbacks();

        expect(theRow()).toStrictEqual({
            app: 'proforma',
            event: 'code.requested',
            email: MEMBER,
            userId: `user_${MEMBER}`,
            ipAddress: '198.51.100.9',
            userAgent: 'vitest/1.0',
            correlationId: id,
        });
        // Written after the send, so the row records what happened.
        expect(prisma.activityLog.create.mock.invocationCallOrder[0]).toBeGreaterThan(auth.api.sendVerificationOTP.mock.invocationCallOrder[0]!);
    });

    it('a non-member: code.refused, reason not_member, no user id, the full address', async () => {
        const response = await POST(gatePost(PATH, { body: { email: STRANGER }, headers: CLIENT }));
        await runAfterCallbacks();

        expect(theRow()).toStrictEqual({
            app: 'proforma',
            event: 'code.refused',
            email: STRANGER,
            userId: null,
            ipAddress: '198.51.100.9',
            userAgent: 'vitest/1.0',
            correlationId: response.headers.get('x-correlation-id'),
            meta: { reason: 'not_member' },
        });
    });

    it('a banned member (the directory says inactive): code.refused, reason banned, with their user id', async () => {
        directory.lookup.mockResolvedValue(member(MEMBER, { active: false }));

        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await runAfterCallbacks();

        expect(theRow()).toMatchObject({ event: 'code.refused', email: MEMBER, userId: `user_${MEMBER}`, meta: { reason: 'banned' } });
    });

    it('the IP limit: code.refused, reason rate_limited_ip, before the directory was asked', async () => {
        vi.mocked(checkIpLimit).mockResolvedValue({ allowed: false, reason: 'ip' });

        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await runAfterCallbacks();

        expect(theRow()).toMatchObject({ event: 'code.refused', email: MEMBER, userId: null, meta: { reason: 'rate_limited_ip' } });
        expect(directory.lookup).not.toHaveBeenCalled();
    });

    it('the address limits: code.refused, reason rate_limited_email, naming which limit, with the user id', async () => {
        vi.mocked(checkEmailLimits).mockResolvedValue({ allowed: false, reason: 'gap' });

        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await runAfterCallbacks();

        expect(theRow()).toMatchObject({
            event: 'code.refused',
            email: MEMBER,
            userId: `user_${MEMBER}`,
            meta: { reason: 'rate_limited_email', limit: 'gap' },
        });
    });

    it('Better Auth throwing: code.refused, reason send_failed, with the user id', async () => {
        auth.api.sendVerificationOTP.mockRejectedValue(new Error('database gone'));

        await POST(gatePost(PATH, { body: { email: MEMBER } }));
        await runAfterCallbacks();

        expect(theRow()).toMatchObject({ event: 'code.refused', email: MEMBER, userId: `user_${MEMBER}`, meta: { reason: 'send_failed' } });
    });

    it('a malformed body: no row, there is no address to attribute one to', async () => {
        await POST(gatePost(PATH, { rawBody: `email=${MEMBER}` }));
        await POST(gatePost(PATH, { body: { email: [MEMBER] } }));
        await POST(gatePost(PATH, { body: { email: MEMBER }, contentType: null }));
        await runAfterCallbacks();

        expect(prisma.activityLog.create).not.toHaveBeenCalled();
    });

    it('a write that rejects changes nothing: the same bytes, the code still sent, after() still drains', async () => {
        prisma.activityLog.create.mockRejectedValue(new Error('relation "activity_log" does not exist'));

        const response = await POST(gatePost(PATH, { body: { email: MEMBER } }));
        expect((await observable(response)).body).toBe(GENERIC_BODY);
        await expect(runAfterCallbacks()).resolves.toBeUndefined();

        expect(auth.api.sendVerificationOTP).toHaveBeenCalledTimes(1);
        expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
    });
});

describe('the two answers that are not the generic one turn on the deployment and the caller, never the address', () => {
    it('403 for a request that is not from this site, member or not, with nothing scheduled', async () => {
        const forMember = await POST(gatePost(PATH, { body: { email: MEMBER }, headers: { origin: 'https://evil.example' } }));
        const forStranger = await POST(gatePost(PATH, { body: { email: STRANGER }, headers: { origin: 'https://evil.example' } }));

        const a = await observable(forMember);
        const b = await observable(forStranger);
        expect(a).toEqual(b);
        expect(a.status).toBe(403);
        expect(a.body).toBe(JSON.stringify({ message: 'Forbidden' }));
        expect(scheduledAfterCount()).toBe(0);
        expectNothingDecidedYet();
    });

    it('503 naming the missing variable when the deployment is misconfigured, with nothing scheduled (checklist 2.9)', async () => {
        vi.stubEnv('RESEND_API_KEY', '');
        try {
            const response = await POST(gatePost(PATH, { body: { email: MEMBER } }));
            expect(response.status).toBe(503);
            expect(await response.text()).toBe('Service unavailable: missing required environment variable(s): RESEND_API_KEY\n');
            expect(scheduledAfterCount()).toBe(0);
        } finally {
            vi.unstubAllEnvs();
        }
    });
});
