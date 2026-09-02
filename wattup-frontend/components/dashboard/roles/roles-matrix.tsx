'use client';

import { setRolePermission } from '@/app/_actions/role-permission-actions';
import { Checkbox } from '@/components/ui/checkbox';
import type { RolePermissionMatrix } from '@/lib/dashboard/role-permissions';
import {
    ALL_ROLES,
    isEditablePermission,
    PERMISSION_GROUPS,
    permissionLabel,
    Permission,
    Role,
    ROLE_LABELS,
} from '@/lib/permissions';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

/**
 * The role by permission matrix (checklist 4c.13).
 *
 * Roles are the columns and permissions the rows, grouped under a heading per group:
 * five columns fit on one screen without a horizontal scroll, and reading one row
 * across tells you which roles hold that permission, which is the question this page
 * exists to answer and the way ADR 0002 section 6 writes the same table down.
 *
 * Every cell that the server would refuse is disabled here too, with the reason on
 * hover, so the UI and setRolePermission's guards say the same thing. Disabling is
 * presentation: the action re-checks all of it, because a server action is a callable
 * endpoint and a hidden control protects nothing.
 */

interface Props {
    matrix: RolePermissionMatrix;
    /**
     * The signed-in user's role, so their own MANAGE_PERMISSIONS cell can be locked.
     * Null when the session carries a role the enum does not contain, which matches no
     * column and so locks nothing extra; setRolePermission refuses it either way.
     */
    actorRole: Role | null;
}

const cellKey = (role: Role, permission: Permission) => `${role}:${permission}`;

/**
 * The groups as the matrix shows them: every group from lib/permissions.ts, with the
 * inert permissions dropped and any group left empty by that removed. The Reserved
 * group disappears entirely, which is the point: a toggle for a permission no code
 * reads would be a control that appears to do something and does nothing.
 */
const EDITABLE_GROUPS = PERMISSION_GROUPS.map(group => ({
    ...group,
    editable: group.permissions.filter(isEditablePermission),
})).filter(group => group.editable.length > 0);

export function RolesMatrix({ matrix, actorRole }: Props) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    /** Optimistic answers, over the server's. Removed again when a write is refused. */
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const [pending, setPending] = useState<Record<string, boolean>>({});

    const fromServer = useMemo(() => {
        const set = new Set<string>();
        for (const role of ALL_ROLES) {
            for (const permission of matrix[role] ?? []) set.add(cellKey(role, permission));
        }
        return set;
    }, [matrix]);

    const holds = (role: Role, permission: Permission) =>
        overrides[cellKey(role, permission)] ?? fromServer.has(cellKey(role, permission));

    /** How many roles hold MANAGE_PERMISSIONS right now, the last one being unremovable. */
    const permissionManagers = ALL_ROLES.filter(role =>
        holds(role, Permission.MANAGE_PERMISSIONS)
    );

    /** Null when the cell is editable, otherwise why it is not. */
    function lockedBecause(role: Role, permission: Permission): string | null {
        if (role === Role.SUPER_ADMIN) {
            return 'A super admin holds every permission. Locked so the product cannot be locked out of its own administration.';
        }
        if (permission !== Permission.MANAGE_PERMISSIONS || !holds(role, permission)) return null;
        if (role === actorRole) {
            return 'You cannot remove the permission you are using to make this change.';
        }
        if (permissionManagers.length <= 1) {
            return 'At least one role must keep permission management.';
        }
        return null;
    }

    function toggle(role: Role, permission: Permission, next: boolean) {
        const key = cellKey(role, permission);
        setOverrides(current => ({ ...current, [key]: next }));
        setPending(current => ({ ...current, [key]: true }));

        startTransition(async () => {
            const result = await setRolePermission(role, permission, next);
            if (!result.success) {
                setOverrides(current => {
                    const rolledBack = { ...current };
                    delete rolledBack[key];
                    return rolledBack;
                });
                toast.error(result.error);
            } else {
                router.refresh();
            }
            setPending(current => {
                const settled = { ...current };
                delete settled[key];
                return settled;
            });
        });
    }

    return (
        <div className='flex flex-col gap-4'>
            <div className='dash-card overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full min-w-[720px] border-collapse text-left'>
                        <thead>
                            <tr className='border-b border-dash-border bg-dash-canvas/70'>
                                <th className='px-4 py-3 text-[11px] font-semibold tracking-[0.04em] text-dash-muted uppercase'>
                                    Permission
                                </th>
                                {ALL_ROLES.map(role => (
                                    <th
                                        key={role}
                                        scope='col'
                                        className='px-3 py-3 text-center text-[11px] font-semibold tracking-[0.04em] text-dash-muted uppercase'>
                                        <span className='inline-flex items-center gap-1'>
                                            {ROLE_LABELS[role]}
                                            {role === Role.SUPER_ADMIN && (
                                                <Lock
                                                    className='size-3'
                                                    aria-label='locked'
                                                />
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {EDITABLE_GROUPS.map(group => (
                                <Fragment key={group.label}>
                                    <tr className='border-b border-dash-border bg-dash-canvas/40'>
                                        <th
                                            scope='colgroup'
                                            colSpan={1 + ALL_ROLES.length}
                                            className='px-4 py-2.5 text-left'>
                                            <span className='text-[13px] font-semibold text-dash-heading'>
                                                {group.label}
                                            </span>
                                            <span className='ml-2 text-[12px] font-normal text-dash-muted'>
                                                {group.description}
                                            </span>
                                        </th>
                                    </tr>
                                    {group.editable.map(permission => (
                                        <tr
                                            key={permission}
                                            className='border-b border-dash-border last:border-0'>
                                            <th
                                                scope='row'
                                                className='px-4 py-2.5 text-left align-middle'>
                                                <span className='text-[13px] font-medium text-dash-heading'>
                                                    {permissionLabel(permission)}
                                                </span>
                                                <code className='ml-2 text-[11px] text-dash-muted'>
                                                    {permission}
                                                </code>
                                            </th>
                                            {ALL_ROLES.map(role => {
                                                const key = cellKey(role, permission);
                                                const locked = lockedBecause(role, permission);
                                                const checked =
                                                    role === Role.SUPER_ADMIN
                                                        ? true
                                                        : holds(role, permission);
                                                return (
                                                    <td
                                                        key={role}
                                                        className='px-3 py-2.5 text-center align-middle'
                                                        title={locked ?? undefined}>
                                                        <Checkbox
                                                            checked={checked}
                                                            disabled={
                                                                locked !== null ||
                                                                pending[key] === true
                                                            }
                                                            aria-label={`${permissionLabel(permission)} for ${ROLE_LABELS[role]}`}
                                                            onCheckedChange={value =>
                                                                toggle(
                                                                    role,
                                                                    permission,
                                                                    value === true
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className='text-[12px] leading-relaxed text-dash-muted'>
                These are role defaults. A change takes effect on the next request, with no
                redeploy, and it applies to everyone holding that role. Individual
                exceptions belong on the person, not on the role: grant or revoke a single
                permission from their page under Team. Pro-forma access is resolved in the
                database, so revoking it closes the builder to that role immediately.
            </p>
        </div>
    );
}
