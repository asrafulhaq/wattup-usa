import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DbMemberDirectory, EnvMemberDirectory, normalizeEmail } from '@/lib/member-directory';

import { prisma } from '../mocks/prisma';

/**
 * lib/member-directory.ts, the two implementations (real, against the fake
 * Prisma client) and the rule for choosing between them. ADR 0001 sections 8
 * and 18, checklist 2.12 and 4b.4.
 */

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('normalizeEmail (checklist 2.12)', () => {
    it('trims, then lowercases', () => {
        expect(normalizeEmail('  Member@HostProposal.TEST ')).toBe('member@hostproposal.test');
    });
});

describe('EnvMemberDirectory', () => {
    it('normalises the entries and the lookup, and answers an active member from the address alone', async () => {
        const directory = new EnvMemberDirectory(' Alice@Example.com ,bob@x.io,, ');

        await expect(directory.lookup('ALICE@example.com')).resolves.toEqual({
            id: 'alice@example.com',
            email: 'alice@example.com',
            name: 'alice@example.com',
            active: true,
        });
        await expect(directory.lookup('bob@x.io ')).resolves.toMatchObject({ active: true });
        await expect(directory.lookup('carol@x.io')).resolves.toBeNull();
    });

    it('an unset or empty list has no members', async () => {
        await expect(new EnvMemberDirectory(undefined).lookup('anyone@x.io')).resolves.toBeNull();
        await expect(new EnvMemberDirectory('').lookup('')).resolves.toBeNull();
    });
});

describe('DbMemberDirectory: the proforma_member view', () => {
    it('selects by the normalised address and returns the row', async () => {
        const row = { id: 'u1', email: 'alice@example.com', name: 'Alice', active: true };
        prisma.proformaMember.findUnique.mockResolvedValue(row);

        await expect(new DbMemberDirectory().lookup(' Alice@Example.com ')).resolves.toEqual(row);
        expect(prisma.proformaMember.findUnique).toHaveBeenCalledWith({
            where: { email: 'alice@example.com' },
            select: { id: true, email: true, name: true, active: true },
        });
    });

    it('no row is no member', async () => {
        prisma.proformaMember.findUnique.mockResolvedValue(null);

        await expect(new DbMemberDirectory().lookup('alice@example.com')).resolves.toBeNull();
    });

    it('a missing view (not yet migrated) is no member, reported once per process; any other failure is no member, reported every time', async () => {
        const directory = new DbMemberDirectory();
        const missingView = new Prisma.PrismaClientKnownRequestError('relation "proforma_member" does not exist', {
            code: 'P2021',
            clientVersion: 'test',
        });

        prisma.proformaMember.findUnique.mockRejectedValue(missingView);
        await expect(directory.lookup('alice@example.com')).resolves.toBeNull();
        await expect(directory.lookup('alice@example.com')).resolves.toBeNull();
        expect(console.error).toHaveBeenCalledTimes(1);

        prisma.proformaMember.findUnique.mockRejectedValue(new Error('connection reset'));
        await expect(directory.lookup('alice@example.com')).resolves.toBeNull();
        await expect(directory.lookup('alice@example.com')).resolves.toBeNull();
        expect(console.error).toHaveBeenCalledTimes(3);
    });
});

describe('getMemberDirectory: which one answers (checklist 4b.4)', () => {
    async function fresh() {
        vi.resetModules();
        return vi.importActual<typeof import('@/lib/member-directory')>('@/lib/member-directory');
    }

    it('outside production, a set PROFORMA_ALLOWLIST answers', async () => {
        vi.stubEnv('NODE_ENV', 'test');
        vi.stubEnv('PROFORMA_ALLOWLIST', 'alice@example.com');
        const { getMemberDirectory } = await fresh();

        const directory = getMemberDirectory();

        expect(directory.constructor.name).toBe('EnvMemberDirectory');
        await expect(directory.lookup('Alice@Example.com')).resolves.toMatchObject({ active: true });
    });

    it('with no allowlist, the view answers', async () => {
        vi.stubEnv('NODE_ENV', 'test');
        vi.stubEnv('PROFORMA_ALLOWLIST', '   ');
        const { getMemberDirectory } = await fresh();

        expect(getMemberDirectory().constructor.name).toBe('DbMemberDirectory');
    });

    it('in production the allowlist is IGNORED even when set, and shouted about', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('PROFORMA_ALLOWLIST', 'alice@example.com');
        const { getMemberDirectory } = await fresh();

        expect(getMemberDirectory().constructor.name).toBe('DbMemberDirectory');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('IGNORED'));
    });
});
