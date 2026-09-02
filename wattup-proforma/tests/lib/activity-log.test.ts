import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { activityContext, clientUserAgent, logActivity, USER_AGENT_MAX_LENGTH } from '@/lib/activity-log';

import { prisma } from '../mocks/prisma';

/**
 * lib/activity-log.ts against the fake Prisma client. ADR 0001 section 9,
 * checklist 4b.5 and 4b.7.
 *
 * Three properties: the row is written in full (app 'proforma', the full
 * address, every field), a failed write is a masked log line and never a
 * throw, and the missing table is reported once per process. Where the writes
 * happen (inside after(), never on the response path) is the gate tests'
 * business: tests/gate/request-code.test.ts and verify-code.test.ts.
 */

const MEMBER = 'member@hostproposal.test';
const MASKED = 'me***@hostproposal.test';
const ID = '6d2d3a4e-0f2b-4c5e-9a1f-1b2c3d4e5f60';

describe('logActivity: the row', () => {
    it('writes app proforma, the full address and every field, exactly', async () => {
        await logActivity({
            event: 'code.requested',
            email: MEMBER,
            userId: 'user_1',
            ipAddress: '203.0.113.7',
            userAgent: 'vitest',
            correlationId: ID,
            meta: { reason: 'not_member' },
        });

        expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
        expect(prisma.activityLog.create).toHaveBeenCalledWith({
            data: {
                app: 'proforma',
                event: 'code.requested',
                email: MEMBER,
                userId: 'user_1',
                ipAddress: '203.0.113.7',
                userAgent: 'vitest',
                correlationId: ID,
                meta: { reason: 'not_member' },
            },
        });
    });

    it('writes explicit nulls for what it was not given, and no meta key at all when there is none', async () => {
        await logActivity({ event: 'signin.failed', email: MEMBER, ipAddress: null, userAgent: null, correlationId: ID });

        const { data } = prisma.activityLog.create.mock.calls[0]![0];
        expect(data).toStrictEqual({
            app: 'proforma',
            event: 'signin.failed',
            email: MEMBER,
            userId: null,
            ipAddress: null,
            userAgent: null,
            correlationId: ID,
        });
        expect('meta' in data).toBe(false);
    });

    it('never masks the address in the row: the dashboard has to be able to search it (checklist 4b.7)', async () => {
        await logActivity({ event: 'signin.success', email: MEMBER, ipAddress: null, userAgent: null, correlationId: ID });

        expect(prisma.activityLog.create.mock.calls[0]![0].data.email).toBe(MEMBER);
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('clientUserAgent', () => {
    it('returns the header as sent', () => {
        expect(clientUserAgent(new Headers({ 'user-agent': 'Mozilla/5.0 (vitest)' }))).toBe('Mozilla/5.0 (vitest)');
    });

    it(`cuts at ${USER_AGENT_MAX_LENGTH} characters and leaves exactly ${USER_AGENT_MAX_LENGTH} alone`, () => {
        const exact = 'a'.repeat(USER_AGENT_MAX_LENGTH);
        const over = 'b'.repeat(USER_AGENT_MAX_LENGTH + 1);

        expect(clientUserAgent(new Headers({ 'user-agent': exact }))).toBe(exact);
        const cut = clientUserAgent(new Headers({ 'user-agent': over }));
        expect(cut).toHaveLength(USER_AGENT_MAX_LENGTH);
        expect(cut).toBe(over.slice(0, USER_AGENT_MAX_LENGTH));
        expect(USER_AGENT_MAX_LENGTH).toBe(512);
    });

    it('is null when the header is absent or blank', () => {
        expect(clientUserAgent(new Headers())).toBeNull();
        expect(clientUserAgent(new Headers({ 'user-agent': '   ' }))).toBeNull();
    });
});

describe('activityContext', () => {
    it('reads the same client address the limiter keys on, the user agent, and carries the correlation id', () => {
        const headers = new Headers({ 'x-forwarded-for': '198.51.100.9, 10.0.0.1', 'user-agent': 'vitest' });

        expect(activityContext(headers, ID)).toEqual({ ipAddress: '198.51.100.9', userAgent: 'vitest', correlationId: ID });
    });

    it('with no address header the ip is the limiter\'s "unknown" bucket, and no user agent is null', () => {
        expect(activityContext(new Headers(), ID)).toEqual({ ipAddress: 'unknown', userAgent: null, correlationId: ID });
    });
});

describe('logActivity: a failed write', () => {
    it('does not throw, and logs the masked address with the correlation id, never the full one', async () => {
        prisma.activityLog.create.mockRejectedValue(new Error('connection reset'));

        await expect(
            logActivity({ event: 'code.requested', email: MEMBER, userId: 'user_1', ipAddress: null, userAgent: null, correlationId: ID }),
        ).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('[activity-log] write failed'),
            expect.objectContaining({ event: 'code.requested', email: MASKED, correlationId: ID, message: 'connection reset' }),
        );
        const everythingLogged = JSON.stringify(vi.mocked(console.error).mock.calls);
        expect(everythingLogged).toContain(MASKED);
        expect(everythingLogged).not.toContain(MEMBER);
    });

    it('a thrown value that is not an Error is logged the same way', async () => {
        prisma.activityLog.create.mockRejectedValue('nope');

        await expect(logActivity({ event: 'signin.failed', email: MEMBER, ipAddress: null, userAgent: null, correlationId: ID })).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ email: MASKED, message: 'nope' }));
    });

    // Last on purpose: the once-per-process flag it sets is module state, and
    // a P2021 in a later test would then log nothing.
    it('reports the missing table (P2021, not yet migrated) once per process, and every other failure every time', async () => {
        const missingTable = new Prisma.PrismaClientKnownRequestError('relation "activity_log" does not exist', {
            code: 'P2021',
            clientVersion: 'test',
        });
        const entry = { event: 'code.refused', email: MEMBER, ipAddress: null, userAgent: null, correlationId: ID } as const;

        prisma.activityLog.create.mockRejectedValue(missingTable);
        await expect(logActivity(entry)).resolves.toBeUndefined();
        await expect(logActivity(entry)).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('checklist 4b.1'), expect.objectContaining({ email: MASKED }));

        prisma.activityLog.create.mockRejectedValue(new Error('connection reset'));
        await expect(logActivity(entry)).resolves.toBeUndefined();
        await expect(logActivity(entry)).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalledTimes(3);
    });
});
