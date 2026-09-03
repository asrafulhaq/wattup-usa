'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * TanStack Query for the dashboard.
 *
 * Mounted on the dashboard layout only, not the whole app: the public marketing pages
 * are server rendered and statically cached, and giving them a client cache would be
 * shipping a library to visitors who never benefit from it.
 *
 * WHAT IT IS FOR HERE. The server already caches, by tag, in `lib/cache-tags.ts`. This
 * is the second, different cache: the one in the browser, which is what makes going back
 * to a filter you already used instant instead of another round trip. The database is
 * roughly 300ms away in development, so the difference is the whole feel of the screen.
 *
 * THE DATA PATH DOES NOT CHANGE. Every `queryFn` and `mutationFn` calls a server action,
 * the same gated actions the pages already use. There is no REST layer and no second
 * place where authorisation has to be re-implemented, which is the part of a client data
 * layer that usually goes wrong.
 *
 * TWO CACHES, ONE RULE. A mutation invalidates BOTH: the server tag through the action's
 * own `updateTag`, and the client key through `invalidateQueries`. Forgetting the second
 * shows the caller stale data they just changed; forgetting the first shows it to
 * everybody else.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
    // Created once per mount rather than at module scope. A module-level client would be
    // shared across requests on the server and leak one user's data into another's.
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Long enough that moving between two screens does not re-query,
                        // short enough that a dashboard left open goes and looks again.
                        staleTime: 30_000,
                        gcTime: 5 * 60_000,
                        // The server action already retries nothing and returns a shape
                        // rather than throwing, so a retry here would repeat a refusal.
                        // Only genuine transport failures reach this.
                        retry: 1,
                        refetchOnWindowFocus: true,
                        // The audit log gains rows constantly; remounting a screen should
                        // show what is there now.
                        refetchOnMount: true,
                    },
                    mutations: { retry: 0 },
                },
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
