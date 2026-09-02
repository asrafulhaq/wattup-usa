// Role and Permission constants matching the Prisma enums defined in schema.prisma.
// Using standalone const objects so this works before and after `prisma generate`.
//
// A role is a template, not the authority (ADR 0002 section 3). What a role holds by
// default lives in the role_permission table, what a user holds on top of it in
// user_permission, and lib/permissions-server.ts resolves the two into one
// PermissionSet per request. Everything in this file is pure and safe to import from
// a client component; nothing here decides anything on its own.

// ─── Role ─────────────────────────────────────────────────────────────────────

export const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    NETWORK_MANAGER: 'NETWORK_MANAGER',
    EDITOR: 'EDITOR',
    SALES: 'SALES',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/**
 * Explicit rank per role (ADR 0002 section 4). Spaced by 20 so a role can be slotted
 * between two existing ones without renumbering anything. canManageRole compares
 * these, never a position in an array, so inserting a role in the wrong place cannot
 * silently misjudge who outranks whom.
 */
export const ROLE_RANK: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 100,
    [Role.ADMIN]: 80,
    [Role.NETWORK_MANAGER]: 60,
    [Role.EDITOR]: 50,
    [Role.SALES]: 40,
};

// ─── Permission ───────────────────────────────────────────────────────────────

export const Permission = {
    // Content
    CREATE_POST: 'CREATE_POST',
    EDIT_ANY_POST: 'EDIT_ANY_POST',
    DELETE_ANY_POST: 'DELETE_ANY_POST',
    PUBLISH_POST: 'PUBLISH_POST',
    // Own-post ownership is deliberately not built. Posts.author is free text with no
    // authorId relation, so these two cannot be told apart from the *_ANY_POST pair
    // and nothing checks them. They stay in the enum pending the decision recorded
    // in ADR 0002 section 7 (client ask I): add the relation, or retire them.
    EDIT_OWN_POST: 'EDIT_OWN_POST',
    DELETE_OWN_POST: 'DELETE_OWN_POST',

    // Charging network
    VIEW_LOCATIONS: 'VIEW_LOCATIONS',
    MANAGE_LOCATIONS: 'MANAGE_LOCATIONS',
    DELETE_LOCATIONS: 'DELETE_LOCATIONS',
    MANAGE_AMENITIES: 'MANAGE_AMENITIES',

    // User management
    VIEW_USERS: 'VIEW_USERS',
    INVITE_USERS: 'INVITE_USERS',
    EDIT_USERS: 'EDIT_USERS',
    CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
    DELETE_USERS: 'DELETE_USERS',
    BAN_USERS: 'BAN_USERS',
    MANAGE_PERMISSIONS: 'MANAGE_PERMISSIONS',

    // Site management
    MANAGE_SITE_SETTINGS: 'MANAGE_SITE_SETTINGS',
    MANAGE_SOCIAL_LINKS: 'MANAGE_SOCIAL_LINKS',

    // Media
    UPLOAD_MEDIA: 'UPLOAD_MEDIA',
    DELETE_MEDIA: 'DELETE_MEDIA',

    // Audit
    VIEW_ACTIVITY_LOG: 'VIEW_ACTIVITY_LOG',

    // Pro-forma builder. wattup-proforma reads this through the proforma_member view.
    ACCESS_PROFORMA: 'ACCESS_PROFORMA',

    // Reserved. The database has carried these since the 20260518 migration and
    // Postgres cannot drop an enum value, so they are listed to keep the schema and
    // the database in agreement (checklist 4a.41). Nothing checks them.
    DELETE_ANY_MEDIA: 'DELETE_ANY_MEDIA',
    DELETE_OWN_MEDIA: 'DELETE_OWN_MEDIA',
    MANAGE_PROFILE: 'MANAGE_PROFILE',
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(Permission);

/**
 * The resolved answer for one user: what they may do right now. Produced by
 * lib/permissions-server.ts, passed down, and read by hasPermission.
 */
export type PermissionSet = ReadonlySet<Permission>;

/** What a caller with no session, or no row, holds. */
export const NO_PERMISSIONS: PermissionSet = new Set<Permission>();

// ─── Role → Permission defaults ───────────────────────────────────────────────
//
// The matrix from ADR 0002 section 6, in code. The 20260903100000_rbac_permissions
// migration seeded role_permission from this table and lib/__tests__ proves the two
// still agree. At runtime the database is the truth: this map is what
// lib/permissions-server.ts falls back to only while the role_permission table does
// not exist yet (a deploy that ships code before the migration), and it is what
// lib/auth.ts derives Better Auth's static access control from, so those two cannot
// drift from each other.
//
// SUPER_ADMIN:     everything, MANAGE_PERMISSIONS included. The only role that edits
//                  permissions; a revoke never applies to it.
// ADMIN:           everything operational. Not MANAGE_PERMISSIONS: an admin who could
//                  grant permissions could grant themselves anything.
// NETWORK_MANAGER: the charging network and the media that goes with it. No content,
//                  no users.
// EDITOR:          content and publishing, social links, a view of the user list.
//                  Edits and publishes locations, but does not delete one or
//                  restructure the amenity catalogue: both are network wide and hard
//                  to undo from the UI. No pro-forma access by default; a per-user
//                  grant covers the exception.
// SALES:           the pro-forma builder plus a read-only view of the network. The
//                  one role with no write permission anywhere.

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    [Role.SUPER_ADMIN]: ALL_PERMISSIONS,

    [Role.ADMIN]: [
        Permission.CREATE_POST,
        Permission.EDIT_ANY_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_OWN_POST,
        Permission.PUBLISH_POST,
        Permission.VIEW_LOCATIONS,
        Permission.MANAGE_LOCATIONS,
        Permission.DELETE_LOCATIONS,
        Permission.MANAGE_AMENITIES,
        Permission.VIEW_USERS,
        Permission.INVITE_USERS,
        Permission.EDIT_USERS,
        Permission.CHANGE_USER_ROLE,
        Permission.DELETE_USERS,
        Permission.BAN_USERS,
        Permission.MANAGE_SITE_SETTINGS,
        Permission.MANAGE_SOCIAL_LINKS,
        Permission.UPLOAD_MEDIA,
        Permission.DELETE_MEDIA,
        Permission.VIEW_ACTIVITY_LOG,
        Permission.ACCESS_PROFORMA,
    ],

    [Role.NETWORK_MANAGER]: [
        Permission.VIEW_LOCATIONS,
        Permission.MANAGE_LOCATIONS,
        Permission.DELETE_LOCATIONS,
        Permission.MANAGE_AMENITIES,
        Permission.UPLOAD_MEDIA,
        Permission.DELETE_MEDIA,
        Permission.ACCESS_PROFORMA,
    ],

    // DELETE_ANY_POST is kept from the pre-4a map, where EDITOR already held it. ADR
    // 0002 section 6 proposes removing it; that is a one row change once the matrix
    // is signed off.
    [Role.EDITOR]: [
        Permission.CREATE_POST,
        Permission.EDIT_ANY_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_OWN_POST,
        Permission.PUBLISH_POST,
        Permission.VIEW_LOCATIONS,
        Permission.MANAGE_LOCATIONS,
        Permission.VIEW_USERS,
        Permission.MANAGE_SOCIAL_LINKS,
        Permission.UPLOAD_MEDIA,
        Permission.DELETE_MEDIA,
    ],

    [Role.SALES]: [Permission.VIEW_LOCATIONS, Permission.ACCESS_PROFORMA],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Synchronous and pure. The first argument is the caller's RESOLVED set from
 * lib/permissions-server.ts, resolved once per request and passed down; a role on
 * its own no longer answers this question. Null and undefined mean "no session".
 */
export function hasPermission(
    permissions: PermissionSet | null | undefined,
    permission: Permission
): boolean {
    return permissions?.has(permission) ?? false;
}

export function isRole(value: unknown): value is Role {
    return typeof value === 'string' && Object.hasOwn(ROLE_RANK, value);
}

export function isPermission(value: unknown): value is Permission {
    return typeof value === 'string' && (ALL_PERMISSIONS as readonly string[]).includes(value);
}

/**
 * True when `actorRole` outranks `targetRole` (ADR 0002 section 4): a strictly higher
 * rank, so nobody manages a peer. A role that is not in ROLE_RANK neither manages nor
 * is managed, which is the safe answer for a value the enum does not contain.
 */
export function canManageRole(actorRole: Role | string, targetRole: Role | string): boolean {
    const actor = isRole(actorRole) ? ROLE_RANK[actorRole] : undefined;
    const target = isRole(targetRole) ? ROLE_RANK[targetRole] : undefined;
    if (actor === undefined || target === undefined) return false;
    return actor > target;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Super Admin',
    [Role.ADMIN]: 'Admin',
    [Role.NETWORK_MANAGER]: 'Network Manager',
    [Role.EDITOR]: 'Editor',
    [Role.SALES]: 'Sales',
};

export const ROLE_BADGE_CLASSES: Record<Role, string> = {
    [Role.SUPER_ADMIN]:
        'bg-purple-50 text-purple-700 border border-purple-200',
    [Role.ADMIN]:
        'bg-[#197dff]/10 text-[#197dff] border border-[#197dff]/20',
    [Role.NETWORK_MANAGER]:
        'bg-amber-50 text-amber-700 border border-amber-200',
    [Role.EDITOR]:
        'bg-emerald-50 text-emerald-700 border border-emerald-200',
    [Role.SALES]:
        'bg-teal-50 text-teal-700 border border-teal-200',
};

// Roles that can be assigned to new users (SUPER_ADMIN is only via seeding). Highest
// first, which is the order the forms list them in.
export const ASSIGNABLE_ROLES: readonly Role[] = [
    Role.ADMIN,
    Role.NETWORK_MANAGER,
    Role.EDITOR,
    Role.SALES,
];

export const ALL_ROLES: readonly Role[] = [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.NETWORK_MANAGER,
    Role.EDITOR,
    Role.SALES,
];

// ─── Permission display ───────────────────────────────────────────────────────
//
// Labels and grouping for the two screens that show a permission set: the user detail
// page (checklist 4c.4, 4c.5) and the profile page (4c.9). Pure, so a client component
// and a test can both read them.

/**
 * One readable name per permission. Written out rather than title-cased from the enum
 * value, because "Manage amenities" says nothing about the amenity catalogue and
 * "Access proforma" reads as a typo.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
    [Permission.CREATE_POST]: 'Write press releases',
    [Permission.EDIT_ANY_POST]: 'Edit any press release',
    [Permission.DELETE_ANY_POST]: 'Delete any press release',
    [Permission.PUBLISH_POST]: 'Publish press releases',
    [Permission.EDIT_OWN_POST]: 'Edit own press release',
    [Permission.DELETE_OWN_POST]: 'Delete own press release',

    [Permission.VIEW_LOCATIONS]: 'See the charging network',
    [Permission.MANAGE_LOCATIONS]: 'Add and edit charging sites',
    [Permission.DELETE_LOCATIONS]: 'Delete charging sites',
    [Permission.MANAGE_AMENITIES]: 'Manage the amenity catalogue',

    [Permission.VIEW_USERS]: 'See the team list',
    [Permission.INVITE_USERS]: 'Invite team members',
    [Permission.EDIT_USERS]: 'Edit team members',
    [Permission.CHANGE_USER_ROLE]: 'Change a role',
    [Permission.DELETE_USERS]: 'Delete an account',
    [Permission.BAN_USERS]: 'Ban and unban',
    [Permission.MANAGE_PERMISSIONS]: 'Grant and revoke permissions',

    [Permission.MANAGE_SITE_SETTINGS]: 'Change site settings and injected scripts',
    [Permission.MANAGE_SOCIAL_LINKS]: 'Change the social links',

    [Permission.UPLOAD_MEDIA]: 'Upload images',
    [Permission.DELETE_MEDIA]: 'Delete images',

    [Permission.VIEW_ACTIVITY_LOG]: 'Read the activity log',

    [Permission.ACCESS_PROFORMA]: 'Open the pro-forma builder',

    [Permission.DELETE_ANY_MEDIA]: 'Delete any image',
    [Permission.DELETE_OWN_MEDIA]: 'Delete own image',
    [Permission.MANAGE_PROFILE]: 'Manage the author profile',
    [Permission.VIEW_ANALYTICS]: 'View analytics',
};

export interface PermissionGroup {
    key: string;
    label: string;
    /** Shown under the group heading when the whole group needs a caveat. */
    note?: string;
    permissions: readonly Permission[];
}

/**
 * The same eight groups this file declares Permission in, in the same order. A screen
 * that regrouped them would drift the first time a permission moved, so
 * lib/__tests__/permissions.test.ts holds every value to exactly one group.
 */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
    {
        key: 'content',
        label: 'Content',
        permissions: [
            Permission.CREATE_POST,
            Permission.EDIT_ANY_POST,
            Permission.DELETE_ANY_POST,
            Permission.PUBLISH_POST,
            Permission.EDIT_OWN_POST,
            Permission.DELETE_OWN_POST,
        ],
    },
    {
        key: 'network',
        label: 'Charging network',
        permissions: [
            Permission.VIEW_LOCATIONS,
            Permission.MANAGE_LOCATIONS,
            Permission.DELETE_LOCATIONS,
            Permission.MANAGE_AMENITIES,
        ],
    },
    {
        key: 'users',
        label: 'User management',
        permissions: [
            Permission.VIEW_USERS,
            Permission.INVITE_USERS,
            Permission.EDIT_USERS,
            Permission.CHANGE_USER_ROLE,
            Permission.DELETE_USERS,
            Permission.BAN_USERS,
            Permission.MANAGE_PERMISSIONS,
        ],
    },
    {
        key: 'site',
        label: 'Site management',
        note: 'Whoever holds site settings can inject JavaScript into every public page.',
        permissions: [Permission.MANAGE_SITE_SETTINGS, Permission.MANAGE_SOCIAL_LINKS],
    },
    {
        key: 'media',
        label: 'Media',
        permissions: [Permission.UPLOAD_MEDIA, Permission.DELETE_MEDIA],
    },
    {
        key: 'audit',
        label: 'Audit',
        permissions: [Permission.VIEW_ACTIVITY_LOG],
    },
    {
        key: 'proforma',
        label: 'Pro-forma builder',
        note: 'Granting this lets the person sign in at the pro-forma site on their next request.',
        permissions: [Permission.ACCESS_PROFORMA],
    },
    {
        key: 'reserved',
        label: 'Reserved',
        note: 'The database has carried these since May and Postgres cannot drop an enum value.',
        permissions: [
            Permission.DELETE_ANY_MEDIA,
            Permission.DELETE_OWN_MEDIA,
            Permission.MANAGE_PROFILE,
            Permission.VIEW_ANALYTICS,
        ],
    },
];

/**
 * Permissions nothing in this app checks: the two own-post values retired by the
 * client's decision I, and the four reserved ones. A screen listing every value of the
 * enum has to say which of them do nothing, or somebody grants one and wonders why it
 * changed nothing.
 */
export const INERT_PERMISSIONS: readonly Permission[] = [
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_MEDIA,
    Permission.DELETE_OWN_MEDIA,
    Permission.MANAGE_PROFILE,
    Permission.VIEW_ANALYTICS,
];

export function isInertPermission(permission: Permission): boolean {
    return INERT_PERMISSIONS.includes(permission);
}
