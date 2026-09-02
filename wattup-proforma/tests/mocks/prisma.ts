import { Prisma } from '@prisma/client';
import { vi } from 'vitest';

import type { Member } from '@/lib/member-directory';

/**
 * The stand-in for lib/prisma.ts: only the methods the gate calls, each a
 * vi.fn a test scripts. No client is constructed and no connection string is
 * read; importing @prisma/client for the Prisma namespace (the error class
 * below) opens nothing.
 *
 * Defaults, restored before every test by resetPrisma():
 *   user.findUnique            -> null      (no such user)
 *   proformaMember.findUnique  -> null      (no such member)
 *   activityLog.create         -> resolves  (the row was written; a test that
 *                                 wants the write to fail scripts a rejection,
 *                                 and the route's response must not change)
 *   $queryRaw / $executeRaw    -> reject with the P2010 "relation does not
 *                                 exist" the real database raises until the
 *                                 proforma_rate_limit migration is applied
 *                                 (checklist 5.7b), so anything that reaches
 *                                 the Postgres limiter takes the documented
 *                                 fail-open path rather than a fake success.
 */

type UserRow = { id?: string; banned: boolean | null };

/** What lib/activity-log.ts hands create(): the columns this app writes, app always 'proforma'. */
export type ActivityLogData = {
    app: 'proforma';
    event: string;
    email: string;
    userId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string;
    meta?: Record<string, unknown>;
};

export const prisma = {
    user: {
        findUnique: vi.fn<
            (args: { where: { id: string } | { email: string }; select: { id?: true; banned: true } }) => Promise<UserRow | null>
        >(),
    },
    proformaMember: {
        findUnique: vi.fn<(args: { where: { email: string }; select: Record<string, true> }) => Promise<Member | null>>(),
    },
    activityLog: {
        create: vi.fn<(args: { data: ActivityLogData }) => Promise<ActivityLogData & { id: string; createdAt: Date }>>(),
    },
    $queryRaw: vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>>(),
    $executeRaw: vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>>(),
};

/** What $queryRaw raises against this database when a table has not been migrated yet (lib/rate-limit.ts isMissingTable). */
export function missingTableError(): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('relation "proforma_rate_limit" does not exist', {
        code: 'P2010',
        clientVersion: 'test',
        meta: { driverAdapterError: { cause: { kind: 'TableDoesNotExist', originalCode: '42P01' } } },
    });
}

export function resetPrisma(): void {
    prisma.user.findUnique.mockReset().mockResolvedValue(null);
    prisma.proformaMember.findUnique.mockReset().mockResolvedValue(null);
    prisma.activityLog.create
        .mockReset()
        .mockImplementation(async ({ data }) => ({ ...data, id: 'activity_1', createdAt: new Date('2026-09-03T10:00:00.000Z') }));
    prisma.$queryRaw.mockReset().mockRejectedValue(missingTableError());
    prisma.$executeRaw.mockReset().mockRejectedValue(missingTableError());
}

resetPrisma();

export default prisma;
