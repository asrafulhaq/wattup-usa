import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { BuilderApp } from '@/components/builder/builder-app';
import { requireMember, safeNext } from '@/lib/gate';

/**
 * The Site Pro-Forma Builder.
 *
 * This replaced app/tool/[[...path]]/route.ts, which read private/tool/ off the
 * disk and streamed it. The engine is now bundled (lib/proforma/) and the control
 * panel is React, so there is no longer a folder of files to serve, and with it
 * goes the whole class of path-traversal risk that route had to defend against.
 * The files it used to serve stay in private/tool/ as the reference the parity
 * tests compare against; nothing serves them.
 *
 * The membership check is unchanged and still runs before anything renders:
 * requireMember reads the session from the DATABASE, not the cookie cache, so a
 * revoked session or a banned user stops here rather than on the next request.
 *
 * `?next=` is built through safeNext even though this path is a constant, because
 * that is the one function allowed to decide what a redirect target may be, and
 * routing every producer through it is what keeps the rule enforceable.
 */
export default async function ToolPage() {
    const member = await requireMember(await headers()).catch(() => null);
    if (!member) redirect(`/login?next=${encodeURIComponent(safeNext('/tool'))}`);

    return <BuilderApp />;
}
