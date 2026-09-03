import { ActivityView } from '@/components/dashboard/activity/activity-view';
import { NoAccess, SessionEnded } from '@/components/dashboard/session-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import {
    getActivityFacets,
    getSiteActivity,
    type ActivityScope,
} from '@/lib/dashboard/activity';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';

export const metadata = {
    title: 'Activity | WattUp',
    description: 'Everything both applications have recorded.',
};

/**
 * The whole audit trail, everyone's (the client asked for this on 2026-09-03).
 *
 * The same rows a person's own page draws, without the filter that narrows them to one
 * account, so it answers "what has been happening" rather than "what has this person
 * been doing". Both applications write to activity_log, so a pro-forma sign-in sits next
 * to a dashboard permission change, which is the point of one shared table.
 *
 * This server component does three things: it checks the permission, it renders the
 * FIRST page so the screen arrives with real content rather than a spinner, and it hands
 * that page to the client view as seed data. Every filter and page after that is a
 * client query against the cache, which is what makes a filter already used come back in
 * the same tick instead of costing another round trip to a database 300ms away.
 *
 * The reader it calls checks VIEW_ACTIVITY_LOG for itself, and so does the server action
 * the client hooks call, so neither this page nor a hook is what decides access.
 */

function one(value: string | string[] | undefined): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
}

function pageParam(value: string | string[] | undefined): number {
    const parsed = Number(one(value));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ActivityPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const authorised = await getSessionPermissions();
    if (!authorised) return <SessionEnded />;
    const { session, permissions } = authorised;

    if (!hasPermission(permissions, Permission.VIEW_ACTIVITY_LOG)) {
        return <NoAccess what='the activity log' role={session.role} />;
    }

    const query = await searchParams;
    const scope: ActivityScope = one(query.scope) === 'signin' ? 'signin' : 'all';
    const filter = {
        app: one(query.app),
        event: one(query.event),
        email: one(query.email),
    };
    const page = pageParam(scope === 'signin' ? query.signinPage : query.activityPage);

    const [initialPage, initialFacets] = await Promise.all([
        getSiteActivity({ scope, page, filter }),
        getActivityFacets(),
    ]);

    return (
        <PageShell>
            <PageHeader
                title='Activity'
                description='Everything the dashboard and the pro-forma builder have recorded, newest first.'
            />
            <ActivityView
                initialScope={scope}
                initialPage={initialPage}
                initialFacets={initialFacets}
            />
        </PageShell>
    );
}
