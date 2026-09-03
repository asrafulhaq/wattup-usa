/**
 * Every cache tag the dashboard uses, in one dependency-free module.
 *
 * They live here rather than beside the reader that sets each one because the writers
 * and the readers sit on opposite sides of the app: an action in `app/_actions/` has to
 * name the same string a reader in `lib/dashboard/` tagged with, and when those strings
 * were defined next to their readers, importing one pulled in the reader's own imports
 * and produced a cycle (`permissions-server` → `role-permissions` → `permission-guard` →
 * `permissions-server`). A tag is a string; it should not drag a module graph behind it.
 *
 * The rule for using them: a read is cached only when every write that could change its
 * answer invalidates it. Anything else belongs uncached, and two things deliberately are.
 *
 *   The authorisation path. `getEffectivePermissions` decides what a request may do and
 *   is never cached beyond the one request, whatever these tags say.
 *
 *   The activity log. Both applications write to it and the pro-forma app cannot
 *   invalidate this app's cache, so a cached page of it could sit stale with no way to
 *   know. An audit trail that lags is worse than one that costs a query.
 */

/** The team list, and one person's identity on their own page. */
export const USERS_TAG = 'users';

/** One person's identity, so a change to them does not invalidate the whole list. */
export const userTag = (userId: string) => `user-${userId}`;

/** One person's effective permissions and where each came from, for the display screens. */
export const userPermissionsTag = (userId: string) => `user-permissions-${userId}`;

/** What every role grants by default. An edit here changes what every person resolves to. */
export const ROLE_PERMISSIONS_TAG = 'role-permissions';

/** Press releases. */
export const POSTS_TAG = 'posts';

/** The charging network: sites, connectors and the amenity catalogue. */
export const LOCATIONS_TAG = 'locations';

/**
 * Everything invalidated by a change to one person's access: their own two tags, plus
 * the team list, which shows their role.
 *
 * A function rather than a list at the call site, because `updateTag` takes one tag at a
 * time and forgetting one of the three is a stale screen nobody notices: the row would
 * keep showing the old role while the permission table showed the new one.
 */
export function invalidateUserAccess(
    updateTag: (tag: string) => void,
    userId: string
): void {
    for (const tag of [USERS_TAG, userTag(userId), userPermissionsTag(userId)]) {
        updateTag(tag);
    }
}
