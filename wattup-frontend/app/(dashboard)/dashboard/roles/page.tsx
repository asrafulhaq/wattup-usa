import { RolesMatrix } from '@/components/dashboard/roles/roles-matrix';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { RolesBodySkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getRolePermissionMatrix } from '@/lib/dashboard/role-permissions';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, isRole, Permission, Role } from '@/lib/permissions';
import { Suspense } from 'react';

export const metadata = {
    title: 'Roles | WattUp Dashboard',
    description: 'What each role may do by default.',
};

/**
 * The Roles page (ADR 0002 section 10, checklist 4c.13 to 4c.16).
 *
 * The client adjusts role defaults from here rather than by a migration, so this screen
 * writes role_permission, the table every request resolves permissions from. It is gated
 * by MANAGE_PERMISSIONS, which by seed only SUPER_ADMIN holds, and every toggle behind it
 * checks the same permission again in app/_actions/role-permission-actions.ts.
 */

async function Matrix({ actorRole }: { actorRole: Role | null }) {
    const matrix = await getRolePermissionMatrix();
    // Null only when the loader's own guard refuses, which the page has already ruled
    // out; belt, not braces, and a NoAccess is the honest answer either way.
    if (!matrix) return <NoAccess what='role permissions' role={actorRole ?? undefined} />;
    return <RolesMatrix matrix={matrix} actorRole={actorRole} />;
}

export default async function RolesPage() {
    const authorised = await getSessionPermissions();
    // Not a redirect: proxy.ts sends anyone holding a session cookie from /admin back to
    // /dashboard, so answering a rejected cookie with a redirect loops the two forever.
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;
    if (!hasPermission(permissions, Permission.MANAGE_PERMISSIONS)) {
        return <NoAccess what='role permissions' role={session.role} />;
    }

    // The session's role is a string on the wire. A value the enum does not contain
    // locks no row: null, rather than a guess at which role it meant. The action refuses
    // the same change regardless, since it compares against the session itself.
    const actorRole: Role | null = isRole(session.role) ? session.role : null;

    return (
        <PageShell>
            <PageHeader
                title='Roles'
                description='What each role may do by default. A change applies to everyone holding that role, on their next request.'
            />
            <Suspense fallback={<RolesBodySkeleton />}>
                <Matrix actorRole={actorRole} />
            </Suspense>
        </PageShell>
    );
}
