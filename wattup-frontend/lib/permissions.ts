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

// ─── What the Roles page may edit ─────────────────────────────────────────────

/**
 * The permissions nothing checks, named once (checklist 4c.13).
 *
 * Two groups, both listed above with their reasons, both here for the same reason: a
 * toggle for a permission no code reads is a control that appears to do something and
 * does nothing.
 *
 *   retired  EDIT_OWN_POST and DELETE_OWN_POST, dropped by ADR 0002 section 10
 *            (client answer I). Posts.author stays free text, so they cannot be told
 *            apart from the *_ANY_POST pair.
 *   reserved DELETE_ANY_MEDIA, DELETE_OWN_MEDIA, MANAGE_PROFILE and VIEW_ANALYTICS,
 *            which exist only because the 20260518 migration created them and Postgres
 *            cannot drop an enum value.
 *
 * Neither group is removed from the enum: role_permission.permission uses the database
 * type, and SUPER_ADMIN is seeded with every value of it. This is the marking, and
 * EDITABLE_PERMISSIONS below is derived from it, so the Roles page and the server
 * action that backs it read one list rather than two that can drift.
 */
export const UNCHECKED_PERMISSIONS: readonly Permission[] = [
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_MEDIA,
    Permission.DELETE_OWN_MEDIA,
    Permission.MANAGE_PROFILE,
    Permission.VIEW_ANALYTICS,
];

/** The 21 permissions the code actually reads, in the order this file declares them. */
export const EDITABLE_PERMISSIONS: readonly Permission[] = ALL_PERMISSIONS.filter(
    permission => !UNCHECKED_PERMISSIONS.includes(permission)
);

/**
 * True for a permission the Roles page offers. False for anything the enum does not
 * contain AND for the six above, so the server action refuses a hand-crafted request
 * for one of them rather than writing a row nothing will ever read.
 */
export function isEditablePermission(value: unknown): value is Permission {
    return isPermission(value) && !UNCHECKED_PERMISSIONS.includes(value);
}

/**
 * The editable permissions in the groups this file already groups them by, for the
 * role by permission matrix. Flattened it is EDITABLE_PERMISSIONS exactly, which
 * lib/__tests__/permissions.test.ts asserts: a permission added to the enum and not
 * given a group fails the suite rather than quietly vanishing from the page.
 */
export const PERMISSION_GROUPS: readonly {
    label: string;
    description: string;
    permissions: readonly Permission[];
}[] = [
    {
        label: 'Content',
        description: 'Press releases and articles on the public site.',
        permissions: [
            Permission.CREATE_POST,
            Permission.EDIT_ANY_POST,
            Permission.DELETE_ANY_POST,
            Permission.PUBLISH_POST,
        ],
    },
    {
        label: 'Charging network',
        description: 'Sites, their bays, and the amenity catalogue.',
        permissions: [
            Permission.VIEW_LOCATIONS,
            Permission.MANAGE_LOCATIONS,
            Permission.DELETE_LOCATIONS,
            Permission.MANAGE_AMENITIES,
        ],
    },
    {
        label: 'User management',
        description: 'Who can sign in, and what each of them may change.',
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
        label: 'Site management',
        description: 'Analytics ids, schema, injected scripts and social links.',
        permissions: [Permission.MANAGE_SITE_SETTINGS, Permission.MANAGE_SOCIAL_LINKS],
    },
    {
        label: 'Media',
        description: 'The image library shared by every screen.',
        permissions: [Permission.UPLOAD_MEDIA, Permission.DELETE_MEDIA],
    },
    {
        label: 'Audit',
        description: 'The activity log, both apps.',
        permissions: [Permission.VIEW_ACTIVITY_LOG],
    },
    {
        label: 'Pro-forma builder',
        description: 'Sign-in to hostproposal.wattupusa.com, resolved in SQL by the proforma_member view.',
        permissions: [Permission.ACCESS_PROFORMA],
    },
];

/**
 * "EDIT_ANY_POST" becomes "Edit any post". Mechanical on purpose: a second map of
 * hand-written labels is one more thing to forget when a permission is added, and the
 * enum names were written to be read.
 */
export function permissionLabel(permission: Permission): string {
    const words = permission.toLowerCase().split('_');
    return words
        .map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' ');
}
