import { getSession } from '@/app/_actions/auth-actions';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
    title: 'Dashboard | WattUp',
    description: 'WattUp admin dashboard.',
};

async function DashboardContent() {
    const session = await getSession();
    if (!session) redirect('/admin');

    const { name, email, id, role } = session;

    const initials = name
        ? name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : email!.slice(0, 2).toUpperCase();

    return (
        <div className='min-h-screen p-4 sm:p-6 lg:p-8'>
            <main className='max-w-7xl mx-auto w-full'>
                <div className='mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-dark tracking-tight'>
                        Welcome back{name ? `, ${name.split(' ')[0]}` : ''}!
                    </h1>
                    <p className='text-sm text-dark/50 mt-1'>
                        Here&apos;s your account overview.
                    </p>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                    {/* Profile card */}
                    <div className='sm:col-span-2 lg:col-span-1 bg-white rounded-xl border border-border/40 p-6 shadow-sm flex flex-col gap-6'>
                        <div className='flex items-center gap-4'>
                            <div className='w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold tracking-tight shrink-0'>
                                {initials}
                            </div>
                            <div className='min-w-0'>
                                <p className='font-bold text-dark text-base truncate'>
                                    {name || 'Admin'}
                                </p>
                                <p className='text-sm text-dark/50 truncate font-normal'>
                                    {email}
                                </p>
                            </div>
                        </div>

                        <div className='flex flex-col gap-3'>
                            <InfoRow
                                label='Role'
                                value={role ?? 'user'}
                                highlight
                            />
                            <InfoRow
                                label='Email verified'
                                value='Yes'
                                status='success'
                            />
                        </div>
                    </div>

                    {/* User ID card */}
                    <div className='bg-white rounded-2xl border border-border/40 p-6 shadow-sm'>
                        <p className='text-[10px] font-bold text-dark/40 uppercase tracking-widest mb-3'>
                            User ID
                        </p>
                        <p className='text-sm font-mono text-dark break-all leading-relaxed'>
                            {id}
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

export default function DashboardPage() {
    return (
        <div className='flex w-full flex-col gap-2 pt-0'>
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
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

