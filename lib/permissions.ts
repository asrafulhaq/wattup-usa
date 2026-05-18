// Role and Permission constants matching the Prisma enums defined in schema.prisma.
// Using standalone const objects so this works before and after `prisma generate`.

// ─── Role ─────────────────────────────────────────────────────────────────────

export const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    COLLABORATOR: 'COLLABORATOR',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// ─── Permission ───────────────────────────────────────────────────────────────

export const Permission = {
    // Post management
    CREATE_POST: 'CREATE_POST',
    EDIT_ANY_POST: 'EDIT_ANY_POST',
    EDIT_OWN_POST: 'EDIT_OWN_POST',
    DELETE_ANY_POST: 'DELETE_ANY_POST',
    DELETE_OWN_POST: 'DELETE_OWN_POST',
    PUBLISH_POST: 'PUBLISH_POST',

    // Site management
    MANAGE_SITE_SETTINGS: 'MANAGE_SITE_SETTINGS',
    MANAGE_SOCIAL_LINKS: 'MANAGE_SOCIAL_LINKS',

    // User management
    VIEW_USERS: 'VIEW_USERS',
    INVITE_USERS: 'INVITE_USERS',
    EDIT_USERS: 'EDIT_USERS',
    CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
    DELETE_USERS: 'DELETE_USERS',
    BAN_USERS: 'BAN_USERS',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ─── Role → Permission mapping ────────────────────────────────────────────────
//
// SUPER_ADMIN: full access
// ADMIN:       all content + site settings + user management (not delete admins)
// EDITOR:      all content + publish + social links + view users; no user management
// COLLABORATOR: create/edit own posts only; no publish, no settings, no user access

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: Object.values(Permission) as Permission[],

    [Role.ADMIN]: [
        Permission.CREATE_POST,
        Permission.EDIT_ANY_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_OWN_POST,
        Permission.PUBLISH_POST,
        Permission.MANAGE_SITE_SETTINGS,
        Permission.MANAGE_SOCIAL_LINKS,
        Permission.VIEW_USERS,
        Permission.INVITE_USERS,
        Permission.EDIT_USERS,
        Permission.CHANGE_USER_ROLE,
        Permission.DELETE_USERS,
        Permission.BAN_USERS,
    ],

    [Role.EDITOR]: [
        Permission.CREATE_POST,
        Permission.EDIT_ANY_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_ANY_POST,
        Permission.DELETE_OWN_POST,
        Permission.PUBLISH_POST,
        Permission.MANAGE_SOCIAL_LINKS,
        Permission.VIEW_USERS,
    ],

    [Role.COLLABORATOR]: [
        Permission.CREATE_POST,
        Permission.EDIT_OWN_POST,
        Permission.DELETE_OWN_POST,
    ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasPermission(
    role: Role | string | null | undefined,
    permission: Permission
): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role as Role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role | string): Permission[] {
    return ROLE_PERMISSIONS[role as Role] ?? [];
}

/** Returns true if `actorRole` is higher in the hierarchy than `targetRole`. */
export function canManageRole(actorRole: Role | string, targetRole: Role | string): boolean {
    const hierarchy: Role[] = [Role.COLLABORATOR, Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN];
    const actorIndex = hierarchy.indexOf(actorRole as Role);
    const targetIndex = hierarchy.indexOf(targetRole as Role);
    return actorIndex > targetIndex;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Super Admin',
    [Role.ADMIN]: 'Admin',
    [Role.EDITOR]: 'Editor',
    [Role.COLLABORATOR]: 'Collaborator',
};

export const ROLE_BADGE_CLASSES: Record<Role, string> = {
    [Role.SUPER_ADMIN]:
        'bg-purple-50 text-purple-700 border border-purple-200',
    [Role.ADMIN]:
        'bg-[#197dff]/10 text-[#197dff] border border-[#197dff]/20',
    [Role.EDITOR]:
        'bg-emerald-50 text-emerald-700 border border-emerald-200',
    [Role.COLLABORATOR]:
        'bg-orange-50 text-orange-700 border border-orange-200',
};

// Roles that can be assigned to new users (SUPER_ADMIN is only via seeding)
export const ASSIGNABLE_ROLES: Role[] = [Role.ADMIN, Role.EDITOR, Role.COLLABORATOR];

export const ALL_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR, Role.COLLABORATOR];
