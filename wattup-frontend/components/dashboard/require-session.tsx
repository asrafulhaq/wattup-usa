import { getSession } from '@/app/_actions/auth-actions';
import { SessionEnded } from './session-state';

/**
 * One gate for every dashboard screen.
 *
 * proxy.ts lets anyone through who merely holds a session cookie, because middleware
 * runs sync with no database and cannot tell a live token from a dead one. This is where
 * that is actually decided, once, so no individual page has to remember to check and no
 * page can answer with a redirect that the proxy then reverses.
 *
 * It sits inside the existing Suspense boundary, so reading the session stays streamed
 * and the dashboard shell is still served without waiting on it.
 *
 * WHY THIS IS STILL IN THE LAYOUT. The performance audit proposed lifting it out, so
 * that each route's own loading.tsx became the boundary Next prerenders, on the grounds
 * that "every page except profile already renders SessionEnded or NoAccess for itself".
 * That was checked route by route before acting on it and it is not true of two:
 *
 *   app/(dashboard)/dashboard/articles/page.tsx has no !authorised branch at all. Its
 *   only use of the resolved pair is hasPermission(authorised?.permissions, ...), which
 *   reads a missing session as a missing permission, and getArticlesForDashboard answers
 *   a refusal with the PUBLIC list rather than with nothing. Signed out, the page would
 *   therefore render the full Articles screen, populated with every published article
 *   and a "Write Article" button.
 *
 *   components/dashboard/profile/page-content.tsx answers no session with `return null`,
 *   under a header the page renders unconditionally: a signed-in looking Profile screen
 *   with an empty body.
 *
 * Five more (locations, locations/amenities, locations/create, locations/edit/[id],
 * settings) do refuse, but through the same conflation, so a dead session is told "You
 * do not have access" with a link that walks back into the dashboard instead of the
 * button that clears the cookie. No data escapes on any of those, since every reader
 * self-guards to [] or null.
 *
 * So the boundary stays here until those pages answer a null session themselves. The
 * prerendering problem it caused was fixed the other way, by giving both Suspense
 * boundaries in dashbaord-wrapper.tsx a real fallback.
 */
export async function RequireSession({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) return <SessionEnded />;
    return <>{children}</>;
}
