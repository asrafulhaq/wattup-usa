'use client';

import { useState, useTransition } from 'react';

import {
    clearPermissionOverride,
    grantPermission,
    revokePermission,
} from '@/app/_actions/admin-user-actions';
import {
    isInertPermission,
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
    type Permission,
} from '@/lib/permissions';
import type { PermissionDescription } from '@/lib/permissions-server';

/**
 * What this person may do, and where each answer comes from (checklist 4c.4, 4c.5).
 *
 * The provenance is the point. "Can they publish?" is a yes or no, but "why" has three
 * answers, and an administrator changing someone's access needs to see which one it is:
 *
 *   from role   the role grants it, and nobody has touched this person specifically.
 *   granted     an override adds it on top of the role.
 *   revoked     an override takes it away, whatever the role says.
 *
 * A two-state switch cannot say that, because turning something off is not the same as
 * putting it back on the role's default. So each permission is three buttons: Default,
 * Granted, Revoked, with the role's own answer shown underneath so the effect of
 * Default is never a guess.
 *
 * Everything here is presentation. Each of the three actions re-checks
 * MANAGE_PERMISSIONS, refuses a SUPER_ADMIN target, refuses the caller's own account
 * and refuses a target who outranks the caller, so a control this component fails to
 * disable is still refused by the server.
 */

type Override = 'granted' | 'revoked' | null;
type Choice = 'default' | 'granted' | 'revoked';

/** The three buttons, in the order a person reads them: neutral, more, less. */
const CHOICES: { value: Choice; label: string; active: string }[] = [
    { value: 'default', label: 'Default', active: 'bg-dark text-white' },
    { value: 'granted', label: 'Granted', active: 'bg-emerald-600 text-white' },
    { value: 'revoked', label: 'Revoked', active: 'bg-red-600 text-white' },
];

export function PermissionSection({
    userId,
    rows,
    canEdit,
    lockedReason,
}: {
    userId: string;
    rows: PermissionDescription[];
    /** False hides every control and renders the same information read only. */
    canEdit: boolean;
    /** Why editing is off, said once above the list rather than on every row. */
    lockedReason?: string;
}) {
    // The server's answer, updated optimistically so a click does not wait for a round
    // trip. A refusal puts the old value back and says why.
    const [state, setState] = useState<Record<string, Override>>(() =>
        Object.fromEntries(rows.map(row => [row.permission, row.override]))
    );
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const byPermission = new Map(rows.map(row => [row.permission, row]));

    function change(permission: Permission, choice: Choice): void {
        const previous = state[permission] ?? null;
        const next: Override = choice === 'default' ? null : choice;
        if (previous === next) return;

        setState(current => ({ ...current, [permission]: next }));
        setError(null);

        startTransition(async () => {
            const result =
                next === null
                    ? await clearPermissionOverride(userId, permission)
                    : next === 'granted'
                      ? await grantPermission(userId, permission)
                      : await revokePermission(userId, permission);

            if (!result.success) {
                setState(current => ({ ...current, [permission]: previous }));
                setError(result.error);
            }
        });
    }

    if (rows.length === 0) {
        return <p className='text-sm text-dark/50'>No permissions to show.</p>;
    }

    return (
        <div className='flex flex-col gap-6'>
            {lockedReason && (
                <p className='rounded-lg border border-dash-border bg-dash-canvas/60 px-4 py-3 text-sm text-dark/70'>
                    {lockedReason}
                </p>
            )}
            {error && (
                <p role='alert' className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                    {error}
                </p>
            )}

            {PERMISSION_GROUPS.map(group => {
                // The inert values are in the groups so the user detail page can name
                // anything it finds, but there is nothing to say about a permission no
                // code reads, so they are not listed here either.
                const listed = group.permissions.filter(p => !isInertPermission(p));
                if (listed.length === 0) return null;

                return (
                    <section key={group.key} className='flex flex-col gap-2'>
                        <h3 className='text-sm font-semibold text-dark'>{group.label}</h3>
                        <p className='text-xs text-dark/50'>{group.description}</p>

                        <ul className='mt-1 divide-y divide-dash-border rounded-lg border border-dash-border'>
                            {listed.map(permission => {
                                const row = byPermission.get(permission);
                                if (!row) return null;
                                const override = state[permission] ?? null;
                                const choice: Choice = override ?? 'default';
                                // What the row resolves to given the pending choice,
                                // rather than the server's last answer, so the yes/no
                                // and the buttons never disagree mid-flight.
                                const effective =
                                    override === 'granted'
                                        ? true
                                        : override === 'revoked'
                                          ? false
                                          : row.fromRole;

                                return (
                                    <li
                                        key={permission}
                                        className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'
                                    >
                                        <div className='min-w-0'>
                                            <p className='text-sm font-medium text-dark'>
                                                {PERMISSION_LABELS[permission]}
                                                <span
                                                    className={
                                                        'ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                                                        (effective
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-dash-canvas text-dark/50 border border-dash-border')
                                                    }
                                                >
                                                    {effective ? 'Yes' : 'No'}
                                                </span>
                                            </p>
                                            <p className='mt-0.5 text-xs text-dark/50'>
                                                <code className='text-[11px]'>{permission}</code>
                                                {' · '}
                                                {row.fromRole
                                                    ? 'the role grants this'
                                                    : 'the role does not grant this'}
                                                {override === 'granted' && ' · added for this person'}
                                                {override === 'revoked' && ' · taken away from this person'}
                                            </p>
                                        </div>

                                        {canEdit ? (
                                            <div
                                                role='group'
                                                aria-label={`${PERMISSION_LABELS[permission]}: where this answer comes from`}
                                                className='flex shrink-0 overflow-hidden rounded-lg border border-dash-border'
                                            >
                                                {CHOICES.map(option => (
                                                    <button
                                                        key={option.value}
                                                        type='button'
                                                        disabled={pending}
                                                        aria-pressed={choice === option.value}
                                                        onClick={() => change(permission, option.value)}
                                                        className={
                                                            'px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
                                                            (choice === option.value
                                                                ? option.active
                                                                : 'bg-white text-dark/60 hover:bg-dash-canvas')
                                                        }
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className='shrink-0 text-xs text-dark/40'>
                                                {choice === 'default' ? 'From role' : CHOICES.find(c => c.value === choice)?.label}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
