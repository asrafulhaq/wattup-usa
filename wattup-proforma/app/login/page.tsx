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
 *
 * The screen is wattup-frontend's admin sign-in page, app/(auth)/admin/page.tsx,
 * copied by hand on 2026-09-02 (ADR 0001 section 3: nothing is imported across
 * the apps): the decorative panel on the left with the grid, the two orbs, the
 * light wordmark, the pill, the headline and the feature pills; the form panel
 * on the right with the mobile wordmark, a 400px column and the footer. Only
 * the words are this app's. Every colour is a token name, so the `dark` class
 * on <html> flips the form panel; the left panel is dark in both schemes, as it
 * is on /admin, and its one literal (#0f1117) is /admin's own. /admin mounts no
 * theme provider, so neither does this page: light is the default for both.
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
        <div className="flex min-h-screen">
            {/* Left decorative panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f1117] p-12 lg:flex lg:w-[45%]">
                {/* Geometric grid background */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                {/* Gradient orbs */}
                <div className="pointer-events-none absolute top-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
                <div className="pointer-events-none absolute right-0 bottom-1/4 h-[280px] w-[280px] rounded-full bg-primary/10 blur-[80px]" />

                {/* Logo */}
                <div className="relative z-10">
                    <Image src="/logo_type_light.svg" alt="WattUp Logo" width={140} height={22} priority />
                </div>

                {/* Center content */}
                <div className="relative z-10 flex flex-1 flex-col justify-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-white/60">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Site Pro-Forma Builder
                        </div>
                        <h2 className="headline-white leading-[110%] font-bold tracking-tight text-white">
                            Build your
                            <br />
                            <span className="text-primary">site pro-forma</span>
                            <br />
                            in minutes
                        </h2>
                        <p className="text-description max-w-xs leading-relaxed font-normal! text-white/50">
                            Six pages of host revenue, live as you type, ready to take to a landlord or a site
                            host.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="mt-10 flex flex-wrap gap-2">
                        {['Live preview', 'EVpin import', 'JSON export', 'Print-ready'].map((f) => (
                            <span
                                key={f}
                                className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50"
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer quote */}
                <div className="relative z-10">
                    <p className="text-xs leading-relaxed text-white/30">&ldquo;The future of mobility starts here.&rdquo;</p>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
                {/* Mobile logo */}
                <div className="mb-12 lg:hidden">
                    <Image src="/logo_type_dark.svg" alt="WattUp Logo" width={140} height={22} priority className="dark:hidden" />
                    <Image
                        src="/logo_type_light.svg"
                        alt="WattUp Logo"
                        width={140}
                        height={22}
                        priority
                        className="hidden dark:block"
                    />
                </div>

                <div className="w-full max-w-[400px]">
                    <LoginForm next={next} />
                </div>

                <p className="mt-10 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} WattUp USA. All rights reserved. Confidential.
                </p>
            </div>
        </div>
    );
}
