import { headers } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';

import { requireMember, safeNext } from '@/lib/gate';

import { LoginForm } from './login-form';

/**
 * /login: the gate's front door, and the one page a signed-out person sees.
 * Public. Checklist 2.25 to 2.32, with 2.0b and 2.23.
 *
 * ?next= arrives from anyone, so it goes through safeNext HERE, at the
 * consumer, before anything trusts it (checklist 2.0b). The tool route
 * validated what it produced; this page validates what it receives, because
 * the two are not the same thing. The validated path is what the form sends to
 * verify-code and where a signed-in member is sent.
 *
 * A current member landing here has nothing to do and goes straight to `next`.
 * The check is requireMember, the one place membership is decided, rather than
 * a bare session lookup: a signed-in person who is no longer a member would
 * otherwise bounce between /tool (which refuses them) and /login (which would
 * send them back) forever. With requireMember they see the form, and
 * verify-code refuses them there with the same 400 as everyone else. A throw
 * is no membership, as everywhere.
 */
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
    const { next: rawNext } = await searchParams;
    const next = safeNext(Array.isArray(rawNext) ? rawNext[0] : rawNext);

    const member = await requireMember(await headers()).catch((error: unknown) => {
        console.error('[login] membership check failed', error);
        return null;
    });
    if (member) redirect(next);

    return (
        <main className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-[392px]">
                <div className="mb-[30px] flex justify-center">
                    <Image
                        src="/logo_type_light.svg"
                        alt="WattUpUSA"
                        width={168}
                        height={26}
                        priority
                        className="block h-[26px] w-auto"
                    />
                </div>
                <div className="rounded-xl border border-line bg-ink-1 p-7">
                    <h1 className="mb-1.5 text-[17px] font-bold tracking-[-0.01em]">Site Pro-Forma Builder</h1>
                    <LoginForm next={next} />
                    <p className="mt-[22px] text-center text-[11.5px] leading-[1.6] text-text-3">
                        WattUpUSA · Confidential
                    </p>
                </div>
            </div>
        </main>
    );
}
