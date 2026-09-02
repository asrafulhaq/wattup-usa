'use client';

import { endStaleSession } from '@/app/_actions/auth-actions';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';

/**
 * What the dashboard shows when it cannot act on the visitor's behalf.
 *
 * Both cases used to be a redirect, which is what made them read as a broken page: a
 * signed-out visitor got the dashboard chrome with an empty sidebar and a blank body,
 * bouncing between /dashboard and /admin, and someone without a permission got dropped
 * on another screen with nothing said. Say which of the two it is, and offer the one
 * action that resolves it.
 */

function Panel({
    icon,
    title,
    children,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    action: React.ReactNode;
}) {
    return (
        <div className='flex min-h-[60vh] w-full items-center justify-center p-6'>
            <div className='w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm'>
                <div className='mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    {icon}
                </div>
                <h1 className='text-lg font-bold tracking-tight text-dark'>{title}</h1>
                <div className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                    {children}
                </div>
                <div className='mt-6 flex justify-center'>{action}</div>
            </div>
        </div>
    );
}

/**
 * The session cookie is present but the server will not accept it.
 *
 * The button does not merely navigate to /admin: it clears the cookie first, because the
 * proxy only checks that one exists and would otherwise send the visitor straight back
 * here. A plain link would look like a button that does nothing.
 */
export function SessionEnded() {
    const [isPending, startTransition] = useTransition();

    return (
        <Panel
            icon={<KeyRound className='size-5' />}
            title='Your session has ended'
            action={
                <Button
                    onClick={() =>
                        // Awaited inside the transition, not merely called: without the
                        // await the transition settles immediately and the button stops
                        // looking busy while the sign-out is still in flight.
                        startTransition(async () => {
                            await endStaleSession();
                        })
                    }
                    disabled={isPending}>
                    {isPending && <Loader2 className='size-4 animate-spin' />}
                    Sign in again
                </Button>
            }>
            <p>
                You are still carrying a sign-in that this server no longer recognises.
                That happens when the session expires, when you sign out in another tab,
                or after the server restarts in development.
            </p>
            <p className='mt-2'>
                Signing in again clears it. Nothing you have saved is affected.
            </p>
        </Panel>
    );
}

/** Signed in, but this screen is not theirs to open. */
export function NoAccess({
    what = 'this section',
    role,
}: {
    what?: string;
    role?: string;
}) {
    return (
        <Panel
            icon={<LockKeyhole className='size-5' />}
            title='You do not have access'
            action={
                <Button asChild variant='outline'>
                    <Link href='/dashboard'>Back to the dashboard</Link>
                </Button>
            }>
            <p>
                Your account cannot open {what}.
                {role ? ` You are signed in as ${role.toLowerCase().replace('_', ' ')}.` : ''}
            </p>
            <p className='mt-2'>
                Ask an administrator to change your role if you need it.
            </p>
        </Panel>
    );
}
