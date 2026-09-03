'use client';

/**
 * Covers the builder while the session is being ended.
 *
 * Sign out is not instant and cannot be: the request has to reach the database
 * and destroy the session before we leave, and then /login is a full page load
 * rather than a client transition, because signing out has to leave nothing of the
 * site behind. That is comfortably a second, during which the screen previously
 * did nothing at all: the button greyed out and the pro-forma sat there, so the
 * click read as ignored.
 *
 * It also hides the document while the browser tears the page down, which matters
 * for a screen showing a landlord's deal terms on a shared machine.
 */
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function SigningOutOverlay() {
    return (
        <motion.div
            role='status'
            aria-live='polite'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className='bg-background/85 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 backdrop-blur-sm'
        >
            <Loader2 className='text-primary size-7 animate-spin' />
            <div className='text-center'>
                <p className='text-sm font-semibold'>Signing you out</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                    Ending this session on this device
                </p>
            </div>
        </motion.div>
    );
}
