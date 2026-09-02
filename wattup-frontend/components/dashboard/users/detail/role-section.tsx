'use client';

import { useState, useTransition } from 'react';

import { updateUserRole } from '@/app/_actions/admin-user-actions';
import {
    ASSIGNABLE_ROLES,
    canManageRole,
    ROLE_BADGE_CLASSES,
    ROLE_LABELS,
    type Role,
} from '@/lib/permissions';

/**
 * The role, and the control that changes it (checklist 4c.3).
 *
 * The list offers only roles the viewer may actually assign: ASSIGNABLE_ROLES, which
 * leaves out SUPER_ADMIN because that one is seeded rather than granted, narrowed again
 * to roles the viewer outranks, so nobody can promote somebody to their own level and
 * then be unable to undo it. `updateUserRole` re-checks all of that.
 *
 * A change is confirmed rather than instant. Unlike a permission override, which is one
 * capability, a role swaps the whole default set underneath a person, and it is worth a
 * deliberate second step.
 */
export function RoleSection({
    userId,
    currentRole,
    actorRole,
    canEdit,
    lockedReason,
}: {
    userId: string;
    currentRole: string;
    actorRole: string;
    canEdit: boolean;
    lockedReason?: string;
}) {
    const [role, setRole] = useState(currentRole);
    const [choice, setChoice] = useState(currentRole);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const assignable = ASSIGNABLE_ROLES.filter(
        candidate => candidate === role || canManageRole(actorRole, candidate)
    );

    function save(): void {
        if (choice === role) return;
        setError(null);
        startTransition(async () => {
            const result = await updateUserRole(userId, choice as Role);
            if (result.success) {
                setRole(choice);
                // The permission section above is drawn from the role's defaults, so it
                // is now showing the previous role's answers. A reload is the honest fix
                // rather than trying to recompute the whole matrix in the browser.
                window.location.reload();
                return;
            }
            setChoice(role);
            setError(result.error);
        });
    }

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
                <span
                    className={
                        'inline-block rounded-full px-2.5 py-1 text-xs font-medium ' +
                        (ROLE_BADGE_CLASSES[role as Role] ?? '')
                    }
                >
                    {ROLE_LABELS[role as Role] ?? role}
                </span>

                {canEdit && (
                    <>
                        <label htmlFor={`role-${userId}`} className='sr-only'>
                            Change role
                        </label>
                        <select
                            id={`role-${userId}`}
                            value={choice}
                            disabled={pending}
                            onChange={event => setChoice(event.target.value)}
                            className='h-9 rounded-lg border border-dash-border bg-white px-3 text-sm text-dark disabled:opacity-60'
                        >
                            {assignable.map(candidate => (
                                <option key={candidate} value={candidate}>
                                    {ROLE_LABELS[candidate]}
                                </option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={save}
                            disabled={pending || choice === role}
                            className='h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {pending ? 'Saving…' : 'Change role'}
                        </button>
                    </>
                )}
            </div>

            {lockedReason && !canEdit && <p className='text-sm text-dark/50'>{lockedReason}</p>}
            {error && (
                <p role='alert' className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                    {error}
                </p>
            )}
        </div>
    );
}
