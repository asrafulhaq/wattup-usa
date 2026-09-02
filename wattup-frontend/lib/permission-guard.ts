import 'server-only';

import { getSession } from '@/app/_actions/auth-actions';
import { hasPermission, type Permission, type PermissionSet } from '@/lib/permissions';
import { getEffectivePermissions } from '@/lib/permissions-server';

/**
 * The server side half of every permission check.
 *
 * Hiding a control in the dashboard is presentation, not protection: a server action is
 * a callable endpoint, so each one gates itself here. Deliberately not exported from a
 * 'use server' module, which would turn the guard itself into an endpoint.
 *
 * Both functions resolve the caller's permissions from the database on every request
 * (lib/permissions-server.ts), never from the session cookie. Only the caller's id is
 * taken from the session. React's cache() dedupes the resolution within one request,
 * so a page that calls getSessionPermissions and then an action that calls
 * requirePermission cost one query between them.
 */

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export interface Authorised {
    session: SessionUser;
    /** The resolved set, for further checks on the same request without a second query. */
    permissions: PermissionSet;
}

/**
 * The session and its resolved set, or null with no session. Asks for no permission:
 * this is for a page deciding what to draw, and for the few actions that are scoped to
 * the caller's own account rather than to a permission.
 */
export async function getSessionPermissions(): Promise<Authorised | null> {
    const session = await getSession();
    if (!session) return null;
    const permissions = await getEffectivePermissions(session.id);
    return { session, permissions };
}

/**
 * The guard. Returns the session and the resolved set when the caller holds
 * `permission`, otherwise null. An action returns UNAUTHORIZED on null and does
 * nothing else; a page renders NoAccess.
 */
export async function requirePermission(permission: Permission): Promise<Authorised | null> {
    const authorised = await getSessionPermissions();
    if (!authorised) return null;
    return hasPermission(authorised.permissions, permission) ? authorised : null;
}

/**
 * The one refusal every action returns.
 *
 * It does not name the missing permission: a caller who cannot do something is not owed
 * a map of what else they cannot reach.
 */
export const UNAUTHORIZED = {
    success: false as const,
    error: 'You do not have permission to do that.',
};
