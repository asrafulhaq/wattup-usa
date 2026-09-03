import React from 'react';

import { QueryProvider } from '@/components/providers/query-provider';

/**
 * The dashboard's own layout. It exists to mount the client query cache here and only
 * here: the public pages are server rendered and statically cached, and shipping a data
 * library to a visitor reading a press release would buy nothing.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <QueryProvider>{children}</QueryProvider>;
}
