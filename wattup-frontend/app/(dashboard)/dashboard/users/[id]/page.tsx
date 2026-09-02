import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { ActivityTable } from '@/components/dashboard/users/detail/activity-table';
import { PermissionSection } from '@/components/dashboard/users/detail/permission-section';
import { RoleSection } from '@/components/dashboard/users/detail/role-section';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { getUserActivity } from '@/lib/dashboard/activity';
import { getDashboardUser } from '@/lib/dashboard/users';
import { getSessionPermissions } from '@/lib/permission-guard';
import {
    canManageRole,
    hasPermission,
    Permission,
    ROLE_BADGE_CLASSES,
    ROLE_LABELS,
    type Role,
} from '@/lib/permissions';
import { describeUserPermissions } from '@/lib/permissions-server';

export const metadata = {
    title: 'Team member | WattUp',
    description: 'One person: their role, what they may do, and what they have done.',
};

/**
 * One team member (checklist 4c.1 to 4c.7).
 *
 * Four sections, each behind its own permission, and each drawn only when the viewer
 * holds it: identity needs VIEW_USERS, which the whole page needs; the role control
 * needs CHANGE_USER_ROLE; the permission controls need MANAGE_PERMISSIONS; the activity
 * and sign-in tables need VIEW_ACTIVITY_LOG. A viewer with only VIEW_USERS sees a
 * readable page with no controls on it rather than an error.
 *
 * Hiding a section is presentation. Every action behind these controls resolves the
 * caller's permissions again for itself, and both data readers below refuse a caller
 * without the permission independently of this page (checklist 4c.12).
 */

/** ?activityPage= and ?signinPage=, both 1 based, both ignored when nonsense. */
function pageParam(value: string | string[] | undefined): number {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function Section({
    id,
    title,
    description,
    children,
}: {
    id?: string;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className='flex flex-col gap-3 rounded-xl border border-dash-border bg-white p-5'>
            <div>
                <h2 className='text-base font-semibold text-dark'>{title}</h2>
                {description && <p className='mt-0.5 text-sm text-dark/50'>{description}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='flex flex-col gap-0.5'>
            <dt className='text-[11px] uppercase tracking-wide text-dark/40'>{label}</dt>
            <dd className='text-sm text-dark'>{children}</dd>
        </div>
    );
}

const DATE = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

export default async function UserDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;

    if (!hasPermission(permissions, Permission.VIEW_USERS)) {
        return <NoAccess what='user management' role={session.role} />;
    }

    const { id } = await params;
    const query = await searchParams;

    // Null for a missing id and for a caller the reader refuses, and notFound is the
    // right answer to both: it tells someone who should not be here the least.
    const user = await getDashboardUser(id);
    if (!user) notFound();

    const isSelf = session.id === user.id;
    const outranks = canManageRole(session.role, user.role);
    const canSeeActivity = hasPermission(permissions, Permission.VIEW_ACTIVITY_LOG);

    // The role control and the permission controls have the same three preconditions,
    // and each is a real refusal in the action behind it, not just a hidden button.
    const canChangeRole =
        hasPermission(permissions, Permission.CHANGE_USER_ROLE) && !isSelf && outranks;
    const canEditPermissions =
        hasPermission(permissions, Permission.MANAGE_PERMISSIONS) &&
        !isSelf &&
        outranks &&
        user.role !== 'SUPER_ADMIN';

    const permissionRows = await describeUserPermissions(user.id);

    const [activity, signIns] = canSeeActivity
        ? await Promise.all([
              getUserActivity({ userId: user.id, scope: 'all', page: pageParam(query.activityPage) }),
              getUserActivity({ userId: user.id, scope: 'signin', page: pageParam(query.signinPage) }),
          ])
        : [null, null];

    const basePath = `/dashboard/users/${user.id}`;
    const initials = user.name.slice(0, 2).toUpperCase();

    const permissionLock = isSelf
        ? 'You cannot change your own permissions.'
        : user.role === 'SUPER_ADMIN'
          ? 'A super admin holds every permission, and an override cannot take one away.'
          : !outranks
            ? 'You cannot change the permissions of someone at your own rank or above.'
            : !hasPermission(permissions, Permission.MANAGE_PERMISSIONS)
              ? 'You do not have permission management.'
              : undefined;

    return (
        <PageShell>
            <Link href='/dashboard/users' className='text-sm text-primary hover:underline'>
                ← Back to team
            </Link>
            <PageHeader title={user.name} description={user.email} />

            {/* 4c.2 Identity */}
            <Section title='Identity'>
                <div className='flex items-start gap-4'>
                    <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary'>
                        {user.image ? (
                            <Image src={user.image} alt='' width={56} height={56} className='h-full w-full object-cover' />
                        ) : (
                            initials
                        )}
                    </div>
                    <dl className='grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3'>
                        <Field label='Name'>{user.name}</Field>
                        <Field label='Email'>
                            <span className='break-all'>{user.email}</span>
                        </Field>
                        <Field label='Role'>
                            <span
                                className={
                                    'inline-block rounded-full px-2 py-0.5 text-xs font-medium ' +
                                    (ROLE_BADGE_CLASSES[user.role as Role] ?? '')
                                }
                            >
                                {ROLE_LABELS[user.role as Role] ?? user.role}
                            </span>
                        </Field>
                        <Field label='Status'>
                            {user.banned ? (
                                <span className='rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'>
                                    Banned
                                </span>
                            ) : (
                                <span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'>
                                    Active
                                </span>
                            )}
                        </Field>
                        <Field label='Email verified'>{user.emailVerified ? 'Yes' : 'No'}</Field>
                        <Field label='Joined'>{DATE.format(user.createdAt)}</Field>
                        {user.banned && (
                            <>
                                <Field label='Ban reason'>{user.banReason ?? '—'}</Field>
                                <Field label='Ban expires'>
                                    {user.banExpires ? DATE.format(user.banExpires) : 'Never'}
                                </Field>
                            </>
                        )}
                    </dl>
                </div>
                {user.banned && (
                    <p className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                        This account is banned, so it holds no permissions at all until it is
                        unbanned, whatever the role and the overrides below say.
                    </p>
                )}
            </Section>

            {/* 4c.3 Role */}
            <Section
                title='Role'
                description='The role sets the defaults. Anything specific to this person is an override below.'
            >
                <RoleSection
                    userId={user.id}
                    currentRole={user.role}
                    actorRole={session.role}
                    canEdit={canChangeRole}
                    lockedReason={
                        isSelf
                            ? 'You cannot change your own role.'
                            : !hasPermission(permissions, Permission.CHANGE_USER_ROLE)
                              ? 'You do not have role management.'
                              : !outranks
                                ? 'You cannot change the role of someone at your own rank or above.'
                                : undefined
                    }
                />
            </Section>

            {/* 4c.4 and 4c.5 Permissions with provenance */}
            <Section
                title='Permissions'
                description='Every permission, whether this person has it, and where that answer comes from.'
            >
                <PermissionSection
                    userId={user.id}
                    rows={permissionRows}
                    canEdit={canEditPermissions}
                    lockedReason={permissionLock}
                />
            </Section>

            {/* 4c.6 Activity, both apps */}
            {canSeeActivity && activity && (
                <Section
                    id='all'
                    title='Activity'
                    description='Everything recorded for this account, from the dashboard and the pro-forma builder alike.'
                >
                    <ActivityTable result={activity} scope='all' basePath={basePath} subjectId={user.id} />
                </Section>
            )}

            {/* 4c.7 Sign-in history */}
            {canSeeActivity && signIns && (
                <Section
                    id='signin'
                    title='Sign-in history'
                    description='Sign-ins and code requests, with the address and browser they came from.'
                >
                    <ActivityTable result={signIns} scope='signin' basePath={basePath} subjectId={user.id} />
                </Section>
            )}
        </PageShell>
    );
}
