import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateEmail } from '@/app/_actions/auth-actions';

/**
 * updateEmail in app/_actions/auth-actions.ts. Finding F6, checklist B.4 and B.5.
 *
 * The property: the current password is confirmed by Better Auth's own
 * auth.api.verifyPassword and by nothing else. The action never reads the
 * account row, so there is no stored hash for it to parse and a change to
 * Better Auth's hash format cannot break it (B.5). The wrong-password answer
 * and the right-password call into changeEmail are pinned by value, not by
 * call count.
 *
 * Nothing real is reached. lib/auth.ts is replaced wholesale, so Better Auth is
 * never constructed: no adapter, no database, no plugin code. lib/prisma.ts is
 * replaced with a guard that fails the test if anything touches it.
 */

const OLD_EMAIL = 'editor@wattupusa.com';
const NEW_EMAIL = 'Editor.New@WattUpUSA.com';
const PASSWORD = 'correct horse battery staple';
const SUCCESS_MESSAGE = 'Email change requested. Check your current inbox to confirm the change.';

/** The request headers next/headers hands the action; identity matters below. */
const REQUEST_HEADERS = new Headers({ cookie: 'better-auth.session_token=tok.sig' });

type VerifyPassword = (input: { body: { password: string }; headers: Headers }) => Promise<{ status: boolean }>;
type ChangeEmail = (input: { body: { newEmail: string }; headers: Headers }) => Promise<{ status: boolean }>;

const mocks = vi.hoisted(() => ({
    getSession: vi.fn<() => Promise<unknown>>(),
    verifyPassword: vi.fn<VerifyPassword>(),
    changeEmail: vi.fn<ChangeEmail>(),
    headers: vi.fn<() => Promise<Headers>>(),
    // The guard. F6 is the promise that the credential row is never read here.
    accountFindFirst: vi.fn(() => {
        throw new Error('[tests] updateEmail must not read the account table (F6)');
    }),
}));

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: mocks.getSession,
            verifyPassword: mocks.verifyPassword,
            changeEmail: mocks.changeEmail,
            signOut: vi.fn(),
        },
    },
}));
vi.mock('@/lib/prisma', () => ({ default: { account: { findFirst: mocks.accountFindFirst } } }));
// Next's request-scoped APIs, which have no request to be scoped to here.
vi.mock('next/headers', () => ({ headers: mocks.headers, cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

/**
 * What auth.api.* throws, in the shape the action reads (`body.code`,
 * `body.message`). Copied from wattup-proforma/tests/helpers.ts apiError, per
 * the repo rule that the two apps share code by copy.
 */
function apiError(code: string, message?: string, status = 'BAD_REQUEST', statusCode = 400): Error {
    const error = new Error(message ?? code.toLowerCase().replaceAll('_', ' '));
    error.name = 'APIError';
    return Object.assign(error, { status, statusCode, body: { code, message: error.message } });
}

function form(fields: Record<string, string>): FormData {
    const data = new FormData();
    for (const [name, value] of Object.entries(fields)) data.append(name, value);
    return data;
}

function signedIn(): void {
    mocks.getSession.mockResolvedValue({
        user: { id: 'user_1', email: OLD_EMAIL, role: 'EDITOR', name: 'Editor', image: null },
        session: { id: 'session_1', userId: 'user_1' },
    });
}

beforeEach(() => {
    mocks.getSession.mockReset().mockResolvedValue(null);
    mocks.verifyPassword.mockReset().mockRejectedValue(new Error('[tests] auth.api.verifyPassword was not scripted'));
    mocks.changeEmail.mockReset().mockResolvedValue({ status: true });
    mocks.headers.mockReset().mockResolvedValue(REQUEST_HEADERS);
    mocks.accountFindFirst.mockClear();
    // The action logs every failure. Silenced as a spy so a test could still assert on it.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('updateEmail: the wrong password', () => {
    it('is refused with the existing message, and changeEmail is never called', async () => {
        signedIn();
        mocks.verifyPassword.mockRejectedValue(apiError('INVALID_PASSWORD', 'Invalid password'));

        const result = await updateEmail(form({ currentPassword: 'not it', newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: false, error: 'Incorrect current password' });
        expect(mocks.changeEmail).not.toHaveBeenCalled();
        expect(mocks.accountFindFirst).not.toHaveBeenCalled();
    });

    it('is the same refusal when verifyPassword resolves { status: false }, the typed contract', async () => {
        signedIn();
        mocks.verifyPassword.mockResolvedValue({ status: false });

        const result = await updateEmail(form({ currentPassword: 'not it', newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: false, error: 'Incorrect current password' });
        expect(mocks.changeEmail).not.toHaveBeenCalled();
    });

    it('is refused without logging: a wrong password is an answer, not an error', async () => {
        signedIn();
        mocks.verifyPassword.mockRejectedValue(apiError('INVALID_PASSWORD', 'Invalid password'));

        await updateEmail(form({ currentPassword: 'not it', newEmail: NEW_EMAIL }));

        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('updateEmail: the right password', () => {
    it('calls changeEmail once, with the exact submitted address and the request headers', async () => {
        signedIn();
        mocks.verifyPassword.mockResolvedValue({ status: true });

        const result = await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: true, message: SUCCESS_MESSAGE });
        expect(mocks.changeEmail).toHaveBeenCalledTimes(1);
        expect(mocks.changeEmail).toHaveBeenCalledWith({ body: { newEmail: NEW_EMAIL }, headers: REQUEST_HEADERS });
        expect(mocks.changeEmail.mock.calls[0][0].headers).toBe(REQUEST_HEADERS);
    });

    it("is decided by Better Auth's verifyPassword, given the submitted password and the same headers, before changeEmail", async () => {
        signedIn();
        mocks.verifyPassword.mockResolvedValue({ status: true });

        await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(mocks.verifyPassword).toHaveBeenCalledTimes(1);
        expect(mocks.verifyPassword).toHaveBeenCalledWith({ body: { password: PASSWORD }, headers: REQUEST_HEADERS });
        expect(mocks.verifyPassword.mock.calls[0][0].headers).toBe(REQUEST_HEADERS);
        expect(mocks.verifyPassword.mock.invocationCallOrder[0]).toBeLessThan(mocks.changeEmail.mock.invocationCallOrder[0]);
    });

    it('never reads the account row: there is no stored hash in this module to parse', async () => {
        signedIn();
        mocks.verifyPassword.mockResolvedValue({ status: true });

        const result = await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(result.success).toBe(true);
        expect(mocks.accountFindFirst).not.toHaveBeenCalled();
    });

    it('reports a changeEmail failure by its message (today the config answers CHANGE_EMAIL_DISABLED)', async () => {
        signedIn();
        mocks.verifyPassword.mockResolvedValue({ status: true });
        mocks.changeEmail.mockRejectedValue(apiError('CHANGE_EMAIL_DISABLED', 'Change email is disabled'));

        const result = await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: false, error: 'Change email is disabled' });
    });
});

describe('updateEmail: a verifyPassword failure that is not a wrong password', () => {
    it.each([
        { label: 'an APIError with another code', error: apiError('SESSION_EXPIRED', 'Session expired'), expected: 'Session expired' },
        { label: 'an error that is not an APIError', error: new TypeError('socket hang up'), expected: 'socket hang up' },
        { label: 'a thrown value with no message', error: { body: {} }, expected: 'Failed to update email' },
    ])('$label is reported as before, and changeEmail is not called', async ({ error, expected }) => {
        signedIn();
        mocks.verifyPassword.mockRejectedValue(error);

        const result = await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: false, error: expected });
        expect(mocks.changeEmail).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledTimes(1);
    });
});

describe('updateEmail: before any password is checked', () => {
    it('signed out is Not authenticated, and the password never reaches Better Auth', async () => {
        mocks.getSession.mockResolvedValue(null);

        const result = await updateEmail(form({ currentPassword: PASSWORD, newEmail: NEW_EMAIL }));

        expect(result).toEqual({ success: false, error: 'Not authenticated' });
        expect(mocks.verifyPassword).not.toHaveBeenCalled();
        expect(mocks.changeEmail).not.toHaveBeenCalled();
    });

    it.each<{ label: string; fields: Record<string, string>; expected: string }>([
        { label: 'no current password', fields: { newEmail: NEW_EMAIL }, expected: 'Current password is required' },
        { label: 'an empty current password', fields: { currentPassword: '', newEmail: NEW_EMAIL }, expected: 'Current password is required' },
        { label: 'no new email', fields: { currentPassword: PASSWORD }, expected: 'New email is required' },
        { label: 'an empty new email', fields: { currentPassword: PASSWORD, newEmail: '' }, expected: 'New email is required' },
    ])('$label is refused before the session is even resolved', async ({ fields, expected }) => {
        signedIn();

        const result = await updateEmail(form(fields));

        expect(result).toEqual({ success: false, error: expected });
        expect(mocks.getSession).not.toHaveBeenCalled();
        expect(mocks.verifyPassword).not.toHaveBeenCalled();
        expect(mocks.changeEmail).not.toHaveBeenCalled();
    });
});
