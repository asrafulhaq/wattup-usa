import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Dashboard | WattUp',
    description: 'WattUp admin dashboard.',
};

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect('/sign-in');

    const { user } = session;

    const initials = user.name
        ? user.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : user.email.slice(0, 2).toUpperCase();

    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className='min-h-screen bg-gray-light p-4 sm:p-6 lg:p-8'>
            <main className='max-w-7xl mx-auto w-full'>
                {/* Welcome */}
                <div className='mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-dark tracking-tight'>
                        Welcome back
                        {user.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </h1>
                    <p className='text-sm text-dark/50 mt-1'>
                        Here&apos;s your account overview.
                    </p>
                </div>

                {/* Cards grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    {/* Profile card */}
                    <div className='sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col gap-6'>
                        <div className='flex items-center gap-4'>
                            {/* Avatar */}
                            <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold tracking-tight shrink-0'>
                                {initials}
                            </div>
                            <div className='min-w-0'>
                                <p className='font-bold text-dark text-base truncate'>
                                    {user.name || 'Admin'}
                                </p>
                                <p className='text-sm text-dark/50 truncate font-normal'>
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className='flex flex-col gap-3'>
                            <InfoRow
                                label='Role'
                                value={user.role ?? 'user'}
                                highlight
                            />
                            <InfoRow label='Member since' value={joinedDate} />
                            <InfoRow
                                label='Email verified'
                                value={user.emailVerified ? 'Yes' : 'No'}
                                status={
                                    user.emailVerified ? 'success' : 'warning'
                                }
                            />
                        </div>
                    </div>

                    {/* User ID card */}
                    <div className='bg-white rounded-2xl border border-border/40 p-6 shadow-sm'>
                        <p className='text-[10px] font-bold text-dark/40 uppercase tracking-widest mb-3'>
                            User ID
                        </p>
                        <p className='text-sm font-mono text-dark break-all leading-relaxed'>
                            {user.id}
                        </p>
                    </div>

                    {/* Session card */}
                    <div className='bg-white rounded-2xl border border-border/40 p-6 shadow-sm flex flex-col justify-between'>
                        <p className='text-[10px] font-bold text-dark/40 uppercase tracking-widest mb-3'>
                            Session Status
                        </p>
                        <div className='flex items-center gap-2 mt-auto'>
                            <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse' />
                            <span className='text-sm font-bold text-dark'>
                                Active
                            </span>
                        </div>
                        <p className='text-xs text-dark/50 mt-3 font-normal'>
                            Session expires in 7 days
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────── */

function InfoRow({
    label,
    value,
    highlight,
    status,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    status?: 'success' | 'warning';
}) {
    return (
        <div className='flex items-center justify-between gap-4'>
            <span className='text-xs text-muted-foreground'>{label}</span>
            {status === 'success' ? (
                <span className='text-xs font-normal text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5'>
                    {value}
                </span>
            ) : status === 'warning' ? (
                <span className='text-xs font-normal text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5'>
                    {value}
                </span>
            ) : highlight ? (
                <span className='text-xs font-semibold text-[#197dff] bg-[#197dff]/8 border border-[#197dff]/15 rounded-full px-2 py-0.5 capitalize'>
                    {value}
                </span>
            ) : (
                <span className='text-xs font-normal text-foreground'>
                    {value}
                </span>
            )}
        </div>
    );
}

function QuickActionPill({ icon, label }: { icon: string; label: string }) {
    return (
        <button className='inline-flex items-center gap-2 rounded-xl border border-border bg-[oklch(0.96_0.002_17.2)] px-4 py-2.5 text-sm font-normal text-foreground transition-all hover:border-[#197dff]/40 hover:bg-[#197dff]/5 hover:text-[#197dff] active:scale-[0.97]'>
            <span>{icon}</span>
            {label}
        </button>
    );
}

