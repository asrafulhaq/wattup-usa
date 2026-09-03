'use client';

import { appLabel, eventLabel } from '@/components/dashboard/users/detail/activity-format';
import type { ActivityScope } from '@/lib/dashboard/activity';

/**
 * The Activity screen's toolbar: the two views, and the three things the log can be
 * narrowed by.
 *
 * Controls only. They report what changed and the view above decides what to do with it,
 * which is what lets the same controls sit over a client query cache rather than a
 * navigation without knowing which they are driving. The search box is not debounced
 * here either: useTableState owns that, so every screen debounces the same way.
 */

export type Facets = { apps: string[]; events: string[] };

const CONTROL =
    'h-9 rounded-lg border border-dash-border bg-white px-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none';

export function ActivityFilters({
    scope,
    app,
    event,
    search,
    facets,
    pending,
    isFiltered,
    onScopeChange,
    onFilterChange,
    onSearchChange,
    onClear,
}: {
    scope: ActivityScope;
    app: string;
    event: string;
    search: string;
    facets: Facets;
    /** True while the rows below belong to the previous request. */
    pending: boolean;
    isFiltered: boolean;
    onScopeChange: (scope: ActivityScope) => void;
    onFilterChange: (key: string, value: string) => void;
    onSearchChange: (value: string) => void;
    onClear: () => void;
}) {
    const tab = (value: ActivityScope, label: string) => (
        <button
            key={value}
            type='button'
            aria-pressed={value === scope}
            onClick={() => onScopeChange(value)}
            className={
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ' +
                (value === scope
                    ? 'border-primary bg-primary text-white'
                    : 'border-dash-border bg-white text-dark/70 hover:bg-dash-canvas')
            }
        >
            {label}
        </button>
    );

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-2'>
                {tab('all', 'Everything')}
                {tab('signin', 'Sign-ins')}
                {/* Fixed width and always present, so the row does not shift when it
                    appears. It says the table below is a moment behind. */}
                <span
                    aria-live='polite'
                    className={
                        'ml-1 text-xs text-dark/40 transition-opacity ' +
                        (pending ? 'opacity-100' : 'opacity-0')
                    }
                >
                    Updating…
                </span>
            </div>

            <div className='flex flex-wrap items-end gap-3 rounded-xl border border-dash-border bg-white p-4'>
                <div className='flex flex-col gap-1'>
                    <label htmlFor='filter-app' className='text-[11px] uppercase tracking-wide text-dark/40'>
                        Application
                    </label>
                    <select
                        id='filter-app'
                        value={app}
                        onChange={e => onFilterChange('app', e.target.value)}
                        className={CONTROL}
                    >
                        <option value=''>Either</option>
                        {facets.apps.map(value => (
                            <option key={value} value={value}>
                                {appLabel(value)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='flex flex-col gap-1'>
                    <label htmlFor='filter-event' className='text-[11px] uppercase tracking-wide text-dark/40'>
                        Event
                    </label>
                    <select
                        id='filter-event'
                        value={event}
                        onChange={e => onFilterChange('event', e.target.value)}
                        className={CONTROL}
                    >
                        <option value=''>Any</option>
                        {facets.events.map(value => (
                            <option key={value} value={value}>
                                {eventLabel(value)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='flex flex-col gap-1'>
                    <label htmlFor='filter-email' className='text-[11px] uppercase tracking-wide text-dark/40'>
                        Address contains
                    </label>
                    <input
                        id='filter-email'
                        type='search'
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder='someone@'
                        className={`${CONTROL} w-56`}
                    />
                </div>

                {isFiltered && (
                    <button
                        type='button'
                        onClick={onClear}
                        className='h-9 rounded-lg border border-dash-border px-4 text-sm font-medium text-dark/70 transition-colors hover:bg-dash-canvas'
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
