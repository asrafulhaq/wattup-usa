import { Permission } from '@/lib/permissions';

/**
 * Every callable endpoint this app exposes, and what it takes to call it
 * (checklist 4a.33, 4a.34).
 *
 * A 'use server' export is an HTTP endpoint whose id is discoverable in the client
 * bundle; a route.ts handler is one by definition. So each of them is listed here,
 * keyed `<file>#<export>`, with either the Permission it requires or an explicit
 * reason it requires none:
 *
 *   PUBLIC        no session. The data is public and the query filters it, or the
 *                 endpoint is a public form or the auth handler itself.
 *   SESSION_ONLY  any signed-in user, no permission, reads nothing beyond the session.
 *   SELF_SCOPED   any signed-in user, acting only on their own account.
 *
 * lib/__tests__/permission-inventory.test.ts walks app/ and lib/ for those files,
 * extracts their exports with the TypeScript compiler, and fails on any export missing
 * from this map or any entry whose export no longer exists (4a.35, 4a.36). For every
 * entry with a permission it also checks that the export's source calls
 * requirePermission(Permission.<that permission>), so the map and the code cannot
 * disagree quietly. A hand audit of 50 actions decays the moment someone adds the
 * 51st; this does not.
 */

export type EndpointAccess =
    | { permission: Permission }
    | { access: 'PUBLIC' | 'SESSION_ONLY' | 'SELF_SCOPED'; reason: string };

const needs = (permission: Permission): EndpointAccess => ({ permission });
const isPublic = (reason: string): EndpointAccess => ({ access: 'PUBLIC', reason });
const sessionOnly = (reason: string): EndpointAccess => ({ access: 'SESSION_ONLY', reason });
const selfScoped = (reason: string): EndpointAccess => ({ access: 'SELF_SCOPED', reason });

export const PERMISSION_INVENTORY: Readonly<Record<string, EndpointAccess>> = {
    // ─── Users ────────────────────────────────────────────────────────────────
    'app/_actions/admin-user-actions.ts#listUsers': needs(Permission.VIEW_USERS),
    'app/_actions/admin-user-actions.ts#createUser': needs(Permission.INVITE_USERS),
    'app/_actions/admin-user-actions.ts#updateUserRole': needs(Permission.CHANGE_USER_ROLE),
    'app/_actions/admin-user-actions.ts#banUser': needs(Permission.BAN_USERS),
    'app/_actions/admin-user-actions.ts#unbanUser': needs(Permission.BAN_USERS),
    'app/_actions/admin-user-actions.ts#deleteUser': needs(Permission.DELETE_USERS),
    'app/_actions/admin-user-actions.ts#getUserById': needs(Permission.VIEW_USERS),
    'app/_actions/admin-user-actions.ts#grantPermission': needs(Permission.MANAGE_PERMISSIONS),
    'app/_actions/admin-user-actions.ts#revokePermission': needs(Permission.MANAGE_PERMISSIONS),

    // ─── Amenity catalogue ────────────────────────────────────────────────────
    'app/_actions/amenityActions.ts#createAmenity': needs(Permission.MANAGE_AMENITIES),
    'app/_actions/amenityActions.ts#updateAmenity': needs(Permission.MANAGE_AMENITIES),
    'app/_actions/amenityActions.ts#setAmenityActive': needs(Permission.MANAGE_AMENITIES),
    'app/_actions/amenityActions.ts#reorderAmenities': needs(Permission.MANAGE_AMENITIES),
    'app/_actions/amenityActions.ts#deleteAmenity': needs(Permission.MANAGE_AMENITIES),

    // ─── Auth ─────────────────────────────────────────────────────────────────
    'app/_actions/auth-actions.ts#logout': selfScoped('Signs out the caller\'s own session.'),
    'app/_actions/auth-actions.ts#getSession': sessionOnly(
        'Returns the caller\'s own session or null; identity, not authorisation.'
    ),
    'app/_actions/auth-actions.ts#updateEmail': selfScoped(
        'Changes the caller\'s own address after verifying their current password.'
    ),
    'app/_actions/auth-actions.ts#updatePassword': selfScoped(
        'Changes the caller\'s own password through Better Auth, which checks the current one.'
    ),
    'app/_actions/auth-actions.ts#endStaleSession': isPublic(
        'Clears a rejected session cookie and redirects; touches nothing but the caller\'s cookies.'
    ),

    // ─── Public forms ─────────────────────────────────────────────────────────
    'app/_actions/contact-actions.ts#submitDriverInquiry': isPublic(
        'The public driver contact form; sends an email, stores nothing.'
    ),
    'app/_actions/contact-actions.ts#submitHostInquiry': isPublic(
        'The public host contact form; sends an email, stores nothing.'
    ),

    // ─── Media ────────────────────────────────────────────────────────────────
    'app/_actions/image-actions.ts#uploadSingleImage': needs(Permission.UPLOAD_MEDIA),
    'app/_actions/image-actions.ts#uploadMultipleImage': needs(Permission.UPLOAD_MEDIA),
    'app/_actions/image-actions.ts#deleteImages': needs(Permission.DELETE_MEDIA),
    'app/_actions/image-actions.ts#deleteSingleImage': needs(Permission.DELETE_MEDIA),
    'app/_actions/image-actions.ts#moveImage': needs(Permission.UPLOAD_MEDIA),
    'app/_actions/image-actions.ts#cleanupOldDrafts': needs(Permission.DELETE_MEDIA),

    // ─── Charging network ─────────────────────────────────────────────────────
    'app/_actions/locationActions.ts#createLocation': needs(Permission.MANAGE_LOCATIONS),
    'app/_actions/locationActions.ts#updateLocation': needs(Permission.MANAGE_LOCATIONS),
    'app/_actions/locationActions.ts#setLocationPublished': needs(Permission.MANAGE_LOCATIONS),
    'app/_actions/locationActions.ts#deleteLocation': needs(Permission.DELETE_LOCATIONS),
    'app/_actions/locationActions.ts#geocodeLocationAddress': needs(Permission.MANAGE_LOCATIONS),
    'app/_actions/locationActions.ts#suggestLocationSlug': needs(Permission.MANAGE_LOCATIONS),

    // ─── Articles ─────────────────────────────────────────────────────────────
    'app/_actions/postActions.ts#getArticles': isPublic(
        'Published articles only; the status filter is inside the query.'
    ),
    'app/_actions/postActions.ts#getPaginatedArticles': isPublic(
        'Published articles only; the status filter is inside the query.'
    ),
    'app/_actions/postActions.ts#getArticleById': isPublic(
        'One published article; the status filter is inside the query.'
    ),
    'app/_actions/postActions.ts#getArticleBySlug': isPublic(
        'One published article; the status filter is inside the query.'
    ),
    'app/_actions/postActions.ts#searchArticles': isPublic(
        'Search over published articles only; the status filter is inside the query.'
    ),
    'app/_actions/postActions.ts#getArticlesForDashboard': needs(Permission.CREATE_POST),
    'app/_actions/postActions.ts#getArticleByIdForDashboard': needs(Permission.CREATE_POST),
    'app/_actions/postActions.ts#createArticle': needs(Permission.CREATE_POST),
    'app/_actions/postActions.ts#updateArticle': needs(Permission.EDIT_ANY_POST),
    'app/_actions/postActions.ts#deleteArticle': needs(Permission.DELETE_ANY_POST),
    'app/_actions/postActions.ts#updateArticleStatus': needs(Permission.PUBLISH_POST),
    'app/_actions/postActions.ts#duplicateArticle': needs(Permission.CREATE_POST),

    // ─── Site settings ────────────────────────────────────────────────────────
    'app/_actions/settingsActions.ts#getSiteSettings': isPublic(
        'Analytics ids, organisation schema and injected scripts, all rendered into every public page.'
    ),
    'app/_actions/settingsActions.ts#updateSiteSettings': needs(Permission.MANAGE_SITE_SETTINGS),

    // ─── Profile and social links ─────────────────────────────────────────────
    'app/_actions/userActions.ts#getPublicAuthorSocialLinks': isPublic(
        'The site owner\'s social links, shown on public press releases.'
    ),
    'app/_actions/userActions.ts#getProfile': isPublic(
        'The site\'s author profile, shown on public pages.'
    ),
    'app/_actions/userActions.ts#getSocialLinks': isPublic(
        'Social links by user id, shown on public press releases; nothing private in the row.'
    ),
    'app/_actions/userActions.ts#updateUserInformationById': needs(Permission.MANAGE_SITE_SETTINGS),
    'app/_actions/userActions.ts#updateSocialLinks': needs(Permission.MANAGE_SOCIAL_LINKS),
    'app/_actions/userActions.ts#updateCurrentUserProfile': selfScoped(
        'Name and bio of the caller\'s own account, through Better Auth.'
    ),
    'app/_actions/userActions.ts#updateCurrentUserPhoto': selfScoped(
        'Photo of the caller\'s own account; writes only their own row.'
    ),
    'app/_actions/userActions.ts#uploadProfilePhoto': selfScoped(
        'Uploads into the profile-photos folder for the caller\'s own account.'
    ),
    'app/_actions/userActions.ts#removeProfilePhoto': selfScoped(
        'Deletes only the id stored as the caller\'s own current photo.'
    ),

    // ─── Route handlers ───────────────────────────────────────────────────────
    'app/api/upload-image/route.ts#POST': needs(Permission.UPLOAD_MEDIA),
    'app/api/auth/[...all]/route.ts#GET': isPublic(
        'Better Auth\'s own handler: sign-in, session, password reset. Rate limited; sign-up disabled.'
    ),
    'app/api/auth/[...all]/route.ts#POST': isPublic(
        'Better Auth\'s own handler: sign-in, session, password reset. Rate limited; sign-up disabled.'
    ),
    'app/api/cron/purge-activity-log/route.ts#GET': isPublic(
        'Vercel Cron, not a person: no session exists to check. Authorised instead by a ' +
            'constant-time comparison against CRON_SECRET, which Vercel sends as a bearer ' +
            'token, and it answers 401 with an empty body to anything else (checklist 4b.8).'
    ),
};
