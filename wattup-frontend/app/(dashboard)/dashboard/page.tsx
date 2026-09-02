import { SessionEnded } from '@/components/dashboard/session-state';
import { EmptyState } from '@/components/dashboard/ui/empty-state';
import { PageHeader } from '@/components/dashboard/ui/page-header';
import { PageShell } from '@/components/dashboard/ui/page-shell';
import { SectionCard } from '@/components/dashboard/ui/section-card';
import { StatCard } from '@/components/dashboard/ui/stat-card';
import { StatusPill } from '@/components/dashboard/ui/status-pill';
import { OverviewPageSkeleton } from '@/components/dashboard/ui/page-skeletons';
import { getOverviewStats } from '@/lib/dashboard/overview';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import {
    ArrowUpRight,
    BatteryCharging,
    FileText,
    MapPin,
    Plug,
    Sparkles,
    Tag,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
    title: 'Overview | WattUp',
    description: 'WattUp admin dashboard.',
};

async function Overview() {
    const authorised = await getSessionPermissions();
    // Deliberately not a redirect to /admin. proxy.ts sends anyone holding a session
    // cookie from /admin back to /dashboard, so redirecting here on a cookie the server
    // rejects put the two in a loop that reloaded the page until the tab was closed.
    if (!authorised) return <SessionEnded />;

    const canSeeNetwork = hasPermission(authorised.permissions, Permission.VIEW_LOCATIONS);
    const stats = canSeeNetwork ? await getOverviewStats() : null;

    return (
        <PageShell>
            <PageHeader
                title='Overview'
                description='The state of the charging network and what still needs a decision.'
                actions={
                    canSeeNetwork ? (
                        <Link
                            href='/dashboard/locations'
                            className='flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover'>
                            Manage locations
                            <ArrowUpRight className='size-4' />
                        </Link>
                    ) : null
                }
            />

            {!stats ? (
                <SectionCard padded={false}>
                    <EmptyState
                        icon={MapPin}
                        title='Nothing to show yet'
                        description='Your account does not manage the charging network. Articles and your profile are in the sidebar.'
                    />
                </SectionCard>
            ) : (
                <>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                        <StatCard
                            icon={MapPin}
                            tone='accent'
                            value={stats.locationsTotal}
                            label='Signed locations'
                            hint={
                                stats.locationsHidden === 0
                                    ? 'All visible on the public site'
                                    : `${stats.locationsHidden} hidden from the public site`
                            }
                        />
                        <StatCard
                            icon={BatteryCharging}
                            tone='emerald'
                            value={stats.open}
                            label='Open to drivers'
                            hint={`${stats.comingSoon} coming soon${
                                stats.underConstruction > 0
                                    ? `, ${stats.underConstruction} in build`
                                    : ''
                            }`}
                        />
                        <StatCard
                            icon={Plug}
                            tone='violet'
                            value={stats.chargingBays}
                            label='Charging bays'
                            hint='Across every signed site'
                        />
                        <StatCard
                            icon={Sparkles}
                            tone='amber'
                            value={`${stats.amenitiesActive}/${stats.amenitiesTotal}`}
                            label='Amenities shown'
                            hint={
                                stats.amenitiesAssigned === 0
                                    ? 'None assigned to a site yet'
                                    : `${stats.amenitiesAssigned} assignments across the network`
                            }
                        />
                    </div>

                    <div className='grid gap-4 lg:grid-cols-[1.4fr_1fr]'>
                        <SectionCard
                            title='Needs a decision'
                            description='Things the dashboard can hold but nobody has set yet. Each one shows as "Being confirmed" to a visitor.'>
                            <ul className='divide-y divide-dash-border'>
                                <PendingRow
                                    label='Sites without a tariff'
                                    count={stats.withoutPrice}
                                    total={stats.locationsTotal}
                                    note='Price per kWh is blank, so the card and the station page say "Being confirmed".'
                                    href='/dashboard/locations'
                                />
                                <PendingRow
                                    label='Sites without amenities'
                                    count={
                                        stats.amenitiesAssigned === 0
                                            ? stats.locationsTotal
                                            : Math.max(
                                                  stats.locationsTotal -
                                                      stats.amenitiesAssigned,
                                                  0
                                              )
                                    }
                                    total={stats.locationsTotal}
                                    note='No facility has been recorded, so the amenities row is empty.'
                                    href='/dashboard/locations'
                                />
                            </ul>
                        </SectionCard>

                        <SectionCard
                            title='Network at a glance'
                            description='How the signed sites break down.'>
                            <dl className='flex flex-col gap-3.5'>
                                <GlanceRow label='Open'>
                                    <StatusPill tone='live'>{stats.open} sites</StatusPill>
                                </GlanceRow>
                                {stats.underConstruction > 0 && (
                                    <GlanceRow label='Under construction'>
                                        <StatusPill tone='progress'>
                                            {stats.underConstruction} sites
                                        </StatusPill>
                                    </GlanceRow>
                                )}
                                <GlanceRow label='Coming soon'>
                                    <StatusPill tone='idle'>
                                        {stats.comingSoon} sites
                                    </StatusPill>
                                </GlanceRow>
                                <GlanceRow label='Hidden from the site'>
                                    <StatusPill
                                        tone={stats.locationsHidden > 0 ? 'muted' : 'idle'}>
                                        {stats.locationsHidden} sites
                                    </StatusPill>
                                </GlanceRow>
                                <GlanceRow label='Articles published'>
                                    <span className='dash-num text-[13px] font-medium text-dash-body'>
                                        {stats.articlesPublished} of {stats.articlesTotal}
                                    </span>
                                </GlanceRow>
                            </dl>
                        </SectionCard>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-3'>
                        <QuickLink
                            href='/dashboard/locations'
                            icon={MapPin}
                            title='Locations'
                            description='Add a site, change its status, or take it off the map.'
                        />
                        <QuickLink
                            href='/dashboard/locations/amenities'
                            icon={Tag}
                            title='Amenities'
                            description='Rename, reorder, and turn facilities on or off network wide.'
                        />
                        <QuickLink
                            href='/dashboard/articles'
                            icon={FileText}
                            title='Articles'
                            description='Write and publish to the public site.'
                        />
                    </div>
                </>
            )}
        </PageShell>
    );
}

function PendingRow({
    label,
    count,
    total,
    note,
    href,
}: {
    label: string;
    count: number;
    total: number;
    note: string;
    href: string;
}) {
    const done = count === 0;
    return (
        <li className='flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0'>
            <div className='min-w-0'>
                <Link
                    href={href}
                    className='text-[14px] font-medium text-dash-heading hover:text-primary'>
                    {label}
                </Link>
                <p className='mt-0.5 text-[12.5px] leading-relaxed text-dash-muted'>
                    {note}
                </p>
            </div>
            <span
                className={`dash-num shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                    done
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                }`}>
                {done ? 'All set' : `${count} of ${total}`}
            </span>
        </li>
    );
}

function GlanceRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className='flex items-center justify-between gap-4'>
            <dt className='text-[13.5px] text-dash-muted'>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function QuickLink({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string;
    icon: typeof MapPin;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className='dash-card group flex flex-col gap-2 p-5 transition-colors hover:border-dash-border-strong hover:bg-white'>
            <span className='flex size-9 items-center justify-center rounded-[10px] bg-dash-canvas text-dash-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary'>
                <Icon className='size-[18px]' />
            </span>
            <span className='mt-1 flex items-center gap-1 text-[14px] font-semibold text-dash-heading'>
                {title}
                <ArrowUpRight className='size-3.5 text-dash-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </span>
            <span className='text-[12.5px] leading-relaxed text-dash-muted'>
                {description}
            </span>
        </Link>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<OverviewPageSkeleton />}>
            <Overview />
        </Suspense>
    );
}
