'use server';

import {
    getActivityFacets,
    getSiteActivity,
    type ActivityPage,
    type ActivityScope,
} from '@/lib/dashboard/activity';

/**
 * The activity log, callable from the browser.
 *
 * These exist so TanStack Query has something to call. They are the data path for the
 * client cache, and deliberately the ONLY one: there is no REST layer, so authorisation
 * is not re-implemented anywhere. Each of these is a thin wrapper over the reader the
 * server components already use, and that reader checks `VIEW_ACTIVITY_LOG` for itself
 * and returns an empty page to anyone without it.
 *
 * A `'use server'` export is a callable endpoint whose id is in the client bundle, so
 * "it is only called from a page that already checked" proves nothing. The check is in
 * the reader, on every call, which is why these can be this thin.
 *
 * The arguments are primitives rather than an object, matching the reader underneath:
 * its cache key is built from them, and two objects with equal contents are not one key.
 */

export async function fetchActivityPage(
    scope: ActivityScope,
    page: number,
    app: string,
    event: string,
    email: string
): Promise<ActivityPage> {
    return getSiteActivity({
        scope,
        page,
        filter: {
            app: app || undefined,
            event: event || undefined,
            email: email || undefined,
        },
    });
}

/** The distinct apps and events present, for the filter controls. */
export async function fetchActivityFacets(): Promise<{ apps: string[]; events: string[] }> {
    return getActivityFacets();
}
