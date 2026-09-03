'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type TransitionStartFunction } from 'react';

import { appLabel, eventLabel } from '@/components/dashboard/users/detail/activity-format';
import type { ActivityScope } from '@/lib/dashboard/activity';

/**
 * The tabs and filters on the Activity page.
 *
 * These were a plain form and plain links, which is the right default and was the wrong
 * default here. Every change was a full navigation, so the table unmounted, the skeleton
 * flashed, and the page waited on a query to a database several hundred milliseconds
 * away before anything came back. Correct, and it felt broken.
 *
 * The fix is not to fetch on the client. The URL is still the only state, the server
 * still does the querying, and a filtered view is still a link somebody can send. What
 * changes is HOW the URL changes: `router.replace` inside `startTransition`, which lets
 * React keep the rows that are already on screen while the new ones are prepared. No
 * skeleton, no unmount, no jump. The old rows simply dim until the new ones replace
 * them, and `isPending` drives that dimming so the wait is visible without being a
 * blocking one.
 *
 * Typing is debounced, because a request per keystroke would be slower and noisier than
 * the thing it replaced. The select controls fire immediately: a change there is a
 * deliberate single act, and waiting on a timer would be the lag all over again.
 */

const DEBOUNCE_MS = 250;

export type Facets = { apps: string[]; events: string[] };

export function ActivityFilters({
    scope,
    app,
    event,
    email,
    facets,
    pending,
    startTransition,
}: {
    scope: ActivityScope;
    app: string;
    event: string;
    email: string;
    facets: Facets;
    /** Owned by the view above, which also dims the table with it. */
    pending: boolean;
    startTransition: TransitionStartFunction;
}) {
    const router = useRouter();
    const params = useSearchParams();

    // The text box is the one control that must not wait for the server between
    // keystrokes, so it holds its own value and pushes the URL behind a timer.
    const [draft, setDraft] = useState(email);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Follow the address filter when it changes from outside, Clear for instance.
    // Adjusted during render rather than in an effect: an effect that sets state runs
    // after a committed paint, so the box would show the old text for one frame and
    // React would render twice for every change.
    const [lastEmail, setLastEmail] = useState(email);
    if (email !== lastEmail) {
        setLastEmail(email);
        setDraft(email);
    }

    useEffect(() => () => {
        if (debounce.current) clearTimeout(debounce.current);
    }, []);

    /** Build the next URL from the current one, so nothing unrelated is lost. */
    function urlWith(changes: Record<string, string | null>): string {
        const next = new URLSearchParams(params.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        // Any change to what is being shown starts again at the first page. Keeping the
        // number would land on page 4 of a result set that now has one page.
        next.delete('activityPage');
        next.delete('signinPage');
        const query = next.toString();
        return `/dashboard/activity${query ? `?${query}` : ''}`;
    }

    function go(changes: Record<string, string | null>): void {
        // replace, not push: filtering is refining one view, not walking a trail, and a
        // back button that steps through every keystroke is its own annoyance.
        startTransition(() => router.replace(urlWith(changes), { scroll: false }));
    }

    function onEmailChange(value: string): void {
        setDraft(value);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => go({ email: value.trim() || null }), DEBOUNCE_MS);
    }

    const filtered = Boolean(app || event || email);

    const tab = (value: ActivityScope, label: string) => (
        <button
            key={value}
            type='button'
            aria-pressed={value === scope}
            onClick={() => go({ scope: value === 'all' ? null : value })}
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

    const select =
        'h-9 rounded-lg border border-dash-border bg-white px-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none';

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-2'>
                {tab('all', 'Everything')}
                {tab('signin', 'Sign-ins')}
                {/* A quiet, fixed-width marker rather than a spinner that shifts the row
                    around it. It says the table below is a moment behind. */}
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
                        onChange={e => go({ app: e.target.value || null })}
                        className={select}
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
                        onChange={e => go({ event: e.target.value || null })}
                        className={select}
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
                        value={draft}
                        onChange={e => onEmailChange(e.target.value)}
                        placeholder='someone@'
                        className={select + ' w-56'}
                    />
                </div>

                {filtered && (
                    <button
                        type='button'
                        onClick={() => go({ app: null, event: null, email: null })}
                        className='h-9 rounded-lg border border-dash-border px-4 text-sm font-medium text-dark/70 transition-colors hover:bg-dash-canvas'
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
