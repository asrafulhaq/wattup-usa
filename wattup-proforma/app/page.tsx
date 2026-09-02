import { redirect } from 'next/navigation';

/**
 * There is no landing page. The tool is the app: a member goes straight to it,
 * and app/tool/[[...path]]/route.ts sends everyone else on to /login with
 * ?next= set. The scaffold's page is gone on purpose.
 */
export default function Home() {
    redirect('/tool/');
}
