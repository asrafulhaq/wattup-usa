'use client';

import { useTransition, type ReactNode } from 'react';

import { ActivityFilters, type Facets } from './activity-filters';
import type { ActivityScope } from '@/lib/dashboard/activity';

/**
 * The filters and the table together, so the table can react to a filter change without
 * either of them fetching anything.
 *
 * `children` is the server-rendered table, passed straight through. That is the whole
 * trick: a client component may hold server-rendered children, React keeps them mounted
 * across a transition, and so the rows already on screen stay there while the next ones
 * are prepared on the server. They dim, they do not disappear, and no skeleton flashes
 * between one filter and the next.
 */
export function ActivityView({
    scope,
    app,
    event,
    email,
    facets,
    children,
}: {
    scope: ActivityScope;
    app: string;
    event: string;
    email: string;
    facets: Facets;
    children: ReactNode;
}) {
    // The transition lives here, where both the controls that start it and the table it
    // dims can see it, so neither has to tell the other anything through an effect.
    const [pending, startTransition] = useTransition();

    return (
        <div className='flex flex-col gap-4'>
            <ActivityFilters
                scope={scope}
                app={app}
                event={event}
                email={email}
                facets={facets}
                pending={pending}
                startTransition={startTransition}
            />

            {/*
                Dimmed and inert while the next page is on its way. Not hidden, and not
                replaced by a placeholder: what is on screen is still true, it is simply
                one filter behind, and showing it beats showing nothing. pointer-events
                are dropped so a click cannot land on a row that is about to be replaced.
            */}
            <div
                aria-busy={pending}
                className={
                    'transition-opacity duration-150 ' +
                    (pending ? 'pointer-events-none opacity-50' : 'opacity-100')
                }
            >
                {children}
            </div>
        </div>
    );
}
