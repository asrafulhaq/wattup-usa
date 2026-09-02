import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('next/headers', () => ({
    headers: async () =>
        new Headers({
            'x-forwarded-for': '203.0.113.7, 10.0.0.1',
            'user-agent': 'Vitest/1.0',
        }),
}));

import {
    ACTIVITY_APP,
    maskEmail,
    requestContext,
    toActivityRow,
    writeActivity,
    type ActivitySink,
} from '@/lib/activity-log';

const context = { ipAddress: '203.0.113.7', userAgent: 'Vitest/1.0' };

describe('maskEmail', () => {
    it('keeps the first character and the domain', () => {
        expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
    });
    it('gives nothing away for a value that is not an address', () => {
        expect(maskEmail('not-an-address')).toBe('***');
        expect(maskEmail('@example.com')).toBe('***');
        expect(maskEmail(undefined)).toBe('(no email)');
    });
});

describe('requestContext', () => {
    it('takes the first forwarded address and the user agent', async () => {
        expect(await requestContext()).toEqual(context);
    });
});

describe('toActivityRow', () => {
    it('maps subject to email/userId and actor to the actor columns, app fixed', () => {
        expect(
            toActivityRow(
                {
                    event: 'permission.granted',
                    actor: { id: 'root', email: 'root@example.com' },
                    target: { id: 'u1', email: 'user@example.com' },
                    meta: { permission: 'ACCESS_PROFORMA' },
                },
                context
            )
        ).toEqual({
            app: 'dashboard',
            event: 'permission.granted',
            email: 'user@example.com',
            userId: 'u1',
            actorUserId: 'root',
            actorEmail: 'root@example.com',
            ipAddress: '203.0.113.7',
            userAgent: 'Vitest/1.0',
            correlationId: null,
            meta: { permission: 'ACCESS_PROFORMA' },
        });
        expect(ACTIVITY_APP).toBe('dashboard');
    });

    it('a deleted subject keeps its email with a null id; no actor means null actor columns', () => {
        const row = toActivityRow(
            { event: 'user.deleted', target: { id: null, email: 'gone@example.com' } },
            { ipAddress: null, userAgent: null }
        );
        expect(row.userId).toBeNull();
        expect(row.email).toBe('gone@example.com');
        expect(row.actorUserId).toBeNull();
        expect(row.actorEmail).toBeNull();
    });
});

describe('writeActivity', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('writes exactly one row with the mapped data', async () => {
        const create = vi.fn(async () => ({}));
        const db = { activityLog: { create } } as unknown as ActivitySink;

        await writeActivity(
            db,
            {
                event: 'role.changed',
                actor: { id: 'root', email: 'root@example.com' },
                target: { id: 'u1', email: 'user@example.com' },
                meta: { from: 'EDITOR', to: 'ADMIN' },
            },
            context
        );

        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith({
            data: {
                app: 'dashboard',
                event: 'role.changed',
                email: 'user@example.com',
                userId: 'u1',
                actorUserId: 'root',
                actorEmail: 'root@example.com',
                ipAddress: '203.0.113.7',
                userAgent: 'Vitest/1.0',
                correlationId: null,
                meta: { from: 'EDITOR', to: 'ADMIN' },
            },
        });
    });

    it('never throws, and the report masks both addresses', async () => {
        const create = vi.fn(async () => {
            throw new Error('connection refused');
        });
        const db = { activityLog: { create } } as unknown as ActivitySink;

        await expect(
            writeActivity(
                db,
                {
                    event: 'user.banned',
                    actor: { id: 'root', email: 'root@example.com' },
                    target: { id: 'u1', email: 'john.doe@example.com' },
                },
                context
            )
        ).resolves.toBeUndefined();

        expect(console.error).toHaveBeenCalledTimes(1);
        const [message] = (console.error as unknown as { mock: { calls: string[][] } }).mock.calls[0];
        expect(message).toContain('user.banned');
        expect(message).toContain('j***@example.com');
        expect(message).toContain('r***@example.com');
        expect(message).not.toContain('john.doe@');
        expect(message).not.toContain('root@');
    });
});
