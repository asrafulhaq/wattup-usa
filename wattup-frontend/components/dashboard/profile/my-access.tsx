import {
    isInertPermission,
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
    ROLE_BADGE_CLASSES,
    ROLE_LABELS,
    type Role,
} from '@/lib/permissions';
import type { PermissionDescription } from '@/lib/permissions-server';

/**
 * Your own role and what it lets you do (checklist 4c.8, 4c.9).
 *
 * Read only, and deliberately so: nobody edits their own access here, and the actions
 * that could would refuse it anyway. It exists to answer the question a person asks
 * when a button they expected is missing, which until now had no answer anywhere in
 * the product.
 *
 * The provenance is shown for the same reason it is shown on the user detail page: "you
 * do not have this" and "someone took this away from you specifically" are different
 * facts, and the second one is worth being able to see and ask about.
 */
export function MyAccess({ role, rows }: { role: string; rows: PermissionDescription[] }) {
    // Both halves of the count must ignore the inert values, or a SUPER_ADMIN, who
    // holds every value of the enum including those, reads "27 of 21".
    const counted = rows.filter(row => !isInertPermission(row.permission));
    const held = counted.filter(row => row.effective);
    const byPermission = new Map(rows.map(row => [row.permission, row]));

    return (
        <section className='flex flex-col gap-4 rounded-xl border border-dash-border bg-white p-5'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                    <h2 className='text-base font-semibold text-dark'>Your access</h2>
                    <p className='mt-0.5 text-sm text-dark/50'>
                        Your role and everything it lets you do. Only an administrator can change
                        this.
                    </p>
                </div>
                <span
                    className={
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ' +
                        (ROLE_BADGE_CLASSES[role as Role] ?? '')
                    }
                >
                    {ROLE_LABELS[role as Role] ?? role}
                </span>
            </div>

            <p className='text-sm text-dark/60'>
                {held.length} of {counted.length} permissions.
            </p>

            <div className='flex flex-col gap-4'>
                {PERMISSION_GROUPS.map(group => {
                    const listed = group.permissions.filter(p => !isInertPermission(p));
                    if (listed.length === 0) return null;

                    return (
                        <div key={group.key} className='flex flex-col gap-1.5'>
                            <h3 className='text-xs font-semibold uppercase tracking-wide text-dark/40'>
                                {group.label}
                            </h3>
                            <ul className='flex flex-wrap gap-1.5'>
                                {listed.map(permission => {
                                    const row = byPermission.get(permission);
                                    if (!row) return null;
                                    const note =
                                        row.override === 'granted'
                                            ? 'given to you specifically'
                                            : row.override === 'revoked'
                                              ? 'taken away from you specifically'
                                              : row.fromRole
                                                ? 'from your role'
                                                : 'not part of your role';
                                    return (
                                        <li
                                            key={permission}
                                            title={`${PERMISSION_LABELS[permission]}: ${note}`}
                                            className={
                                                'rounded-full border px-2.5 py-1 text-xs font-medium ' +
                                                (row.effective
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'border-dash-border bg-dash-canvas text-dark/35 line-through')
                                            }
                                        >
                                            {PERMISSION_LABELS[permission]}
                                            {row.override && (
                                                <span className='ml-1 font-normal opacity-70'>
                                                    ({row.override === 'granted' ? 'added' : 'removed'})
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
