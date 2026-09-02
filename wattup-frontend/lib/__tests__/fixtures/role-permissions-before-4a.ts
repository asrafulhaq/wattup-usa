/**
 * ROLE_PERMISSIONS exactly as lib/permissions.ts declared it on main at 2fce8d5, the
 * commit phase 4a started from. Copied, not retyped from memory, and never edited:
 * this is the "before" that role-permission-seed.test.ts holds the migration's seed
 * to (checklist 4a.5). SUPER_ADMIN was `Object.values(Permission)` over the 17
 * values of the time; that list is spelled out here so the fixture does not depend
 * on today's enum. The fourth role of the time is omitted because it was removed and
 * its users reassigned before the migration runs (4a.24).
 */
export const ROLE_PERMISSIONS_BEFORE_4A: Record<'SUPER_ADMIN' | 'ADMIN' | 'EDITOR', readonly string[]> = {
    SUPER_ADMIN: [
        'CREATE_POST',
        'EDIT_ANY_POST',
        'EDIT_OWN_POST',
        'DELETE_ANY_POST',
        'DELETE_OWN_POST',
        'PUBLISH_POST',
        'MANAGE_SITE_SETTINGS',
        'MANAGE_SOCIAL_LINKS',
        'VIEW_USERS',
        'INVITE_USERS',
        'EDIT_USERS',
        'CHANGE_USER_ROLE',
        'DELETE_USERS',
        'BAN_USERS',
        'MANAGE_LOCATIONS',
        'DELETE_LOCATIONS',
        'MANAGE_AMENITIES',
    ],

    ADMIN: [
        'CREATE_POST',
        'EDIT_ANY_POST',
        'EDIT_OWN_POST',
        'DELETE_ANY_POST',
        'DELETE_OWN_POST',
        'PUBLISH_POST',
        'MANAGE_SITE_SETTINGS',
        'MANAGE_SOCIAL_LINKS',
        'VIEW_USERS',
        'INVITE_USERS',
        'EDIT_USERS',
        'CHANGE_USER_ROLE',
        'DELETE_USERS',
        'BAN_USERS',
        'MANAGE_LOCATIONS',
        'DELETE_LOCATIONS',
        'MANAGE_AMENITIES',
    ],

    EDITOR: [
        'CREATE_POST',
        'EDIT_ANY_POST',
        'EDIT_OWN_POST',
        'DELETE_ANY_POST',
        'DELETE_OWN_POST',
        'PUBLISH_POST',
        'MANAGE_SOCIAL_LINKS',
        'VIEW_USERS',
        'MANAGE_LOCATIONS',
    ],
};
