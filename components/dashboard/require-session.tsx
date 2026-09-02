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
 */
export async function RequireSession({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) return <SessionEnded />;
    return <>{children}</>;
}
