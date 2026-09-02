import 'server-only';

import { hasPermission, type Permission } from '@/lib/permissions';
import { getSession } from './auth-actions';

/**
 * The server side half of every permission check.
 *
 * Hiding a control in the dashboard is presentation, not protection: a server action is
 * a callable endpoint, so each one gates itself here. Deliberately not exported from a
 * 'use server' module, which would turn the guard itself into an endpoint.
 */

/** Returns the session when the caller holds `permission`, otherwise null. */
export async function sessionWith(permission: Permission) {
    const session = await getSession();
    if (!session) return null;
    return hasPermission(session.role, permission) ? session : null;
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
