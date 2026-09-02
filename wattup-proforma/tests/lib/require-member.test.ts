import { describe, expect, it } from 'vitest';

import { requireMember } from '@/lib/gate';

import { fakeSession } from '../helpers';
import { auth } from '../mocks/auth';
import { directory, member } from '../mocks/member-directory';
import { prisma } from '../mocks/prisma';

/**
 * requireMember, the one place a gated request decides membership. Checklist
 * 5.13, ADR 0001 section 5 ("immediate revocation").
 *
 * The real function, with its three dependencies scripted: Better Auth's
 * getSession, the user row, and the directory. The property: a session is not
 * membership. A session for a user who has since been banned, removed from the
 * directory, or deactivated in it, is refused on the very next request, with
 * no redeploy and no waiting for the cookie cache to expire.
 */

const MEMBER = 'member@hostproposal.test';

const requestHeaders = () => new Headers({ cookie: 'wup.session_token=tok.sig' });

function currentMember(email = MEMBER) {
    const session = fakeSession({ email });
    auth.api.getSession.mockResolvedValue(session);
    prisma.user.findUnique.mockResolvedValue({ banned: false });
    directory.lookup.mockResolvedValue(member(email));
    return session;
}

describe('requireMember', () => {
    it('reads the session from the database, never from the signed cookie cache', async () => {
        currentMember();
        const headers = requestHeaders();

        await requireMember(headers);

        expect(auth.api.getSession).toHaveBeenCalledTimes(1);
        expect(auth.api.getSession).toHaveBeenCalledWith({ headers, query: { disableCookieCache: true } });
    });

    it('no session: null, and nothing else is consulted', async () => {
        auth.api.getSession.mockResolvedValue(null);

        await expect(requireMember(requestHeaders())).resolves.toBeNull();

        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(directory.lookup).not.toHaveBeenCalled();
    });

    it('a session for a user banned in the dashboard: null, before the directory is asked', async () => {
        const session = currentMember();
        prisma.user.findUnique.mockResolvedValue({ banned: true });

        await expect(requireMember(requestHeaders())).resolves.toBeNull();

        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: session.user.id }, select: { banned: true } });
        expect(directory.lookup).not.toHaveBeenCalled();
    });

    it('a session whose user row no longer exists: null', async () => {
        currentMember();
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(requireMember(requestHeaders())).resolves.toBeNull();
        expect(directory.lookup).not.toHaveBeenCalled();
    });

    it('banned = null (never banned) is not a ban: the directory decides', async () => {
        const session = currentMember();
        prisma.user.findUnique.mockResolvedValue({ banned: null });

        await expect(requireMember(requestHeaders())).resolves.toBe(session);
        expect(directory.lookup).toHaveBeenCalledTimes(1);
    });

    it('a session for someone the directory no longer lists: null (revocation, no redeploy)', async () => {
        currentMember();
        directory.lookup.mockResolvedValue(null);

        await expect(requireMember(requestHeaders())).resolves.toBeNull();
    });

    it('a session for someone the directory lists as inactive: null', async () => {
        currentMember();
        directory.lookup.mockResolvedValue(member(MEMBER, { active: false }));

        await expect(requireMember(requestHeaders())).resolves.toBeNull();
    });

    it('asks the directory for the normalised session address', async () => {
        currentMember('  Member@HostProposal.TEST ');

        await requireMember(requestHeaders());

        expect(directory.lookup).toHaveBeenCalledWith(MEMBER);
    });

    it('a current member: the session, as Better Auth issued it', async () => {
        const session = currentMember();

        await expect(requireMember(requestHeaders())).resolves.toBe(session);
    });

    it('a failing session read propagates: nothing is caught here, and a caller treats a throw as no membership', async () => {
        auth.api.getSession.mockRejectedValue(new Error('database gone'));

        await expect(requireMember(requestHeaders())).rejects.toThrow('database gone');
    });

    it('a failing user read propagates the same way', async () => {
        currentMember();
        prisma.user.findUnique.mockRejectedValue(new Error('database gone'));

        await expect(requireMember(requestHeaders())).rejects.toThrow('database gone');
    });
});
