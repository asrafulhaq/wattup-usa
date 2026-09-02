import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { statusLabelFor } from './public';
import { LOCATIONS_TAG } from './server';
import type { StationStatus } from './types';

/**
 * The network summarised by city, for the marketing pages.
 *
 * /for-drivers carried its own hand written list of cities, which is how the site ended
 * up advertising Lake Forest and Huntington Beach: places with no signed site, sitting
 * beside real ones with no way for a reader to tell the difference.
 *
 * The home page marquee is deliberately left hand written. It names markets rather than
 * sites, so it is a claim about where the company is expanding, not a list of what a
 * driver can use today.
 *
 * Grouped by city rather than listed per site, because that is what those sections show.
 * Only published sites count, so hiding one in the dashboard removes it from every
 * marketing page as well as from the finder.
 */

export interface NetworkCity {
    name: string;
    /** State or region, for cities that share a name across states. */
    region: string;
    /**
     * "San Bernardino County", or empty when the sites carry no county.
     *
     * Joined when a city straddles two, which none currently do, but grouping by city
     * makes it possible and silently showing one of them would be wrong.
     */
    county: string;
    /** "310kW Ultra Fast Charging". */
    capacity: string;
    /** "4 charging bays", or "2 sites · 9 bays" where a city has more than one. */
    detail: string;
    /** "Open" or "Coming soon", from the same helper the finder uses. */
    status: string;
    siteCount: number;
    /** The single site's page, when the city has exactly one. Null otherwise. */
    slug: string | null;
    /**
     * Where the city links to.
     *
     * One site goes straight to that site's page, which is the answer the reader wants.
     * Several go to the finder pre-filtered to the city, because picking between them is
     * the finder's job and it can sort by distance once the visitor allows location.
     */
    href: string;
}

export async function getNetworkCities(): Promise<NetworkCity[]> {
    'use cache';
    cacheLife('hours');
    cacheTag(LOCATIONS_TAG);

    const rows = await prisma.location.findMany({
        where: { published: true },
        orderBy: [{ goLiveYear: 'asc' }, { city: 'asc' }],
        select: {
            city: true,
            region: true,
            county: true,
            slug: true,
            status: true,
            maxPowerKw: true,
            chargerCount: true,
            goLiveYear: true,
        },
    });

    const byCity = new Map<string, typeof rows>();
    for (const row of rows) {
        const key = `${row.city}|${row.region}`;
        const group = byCity.get(key);
        if (group) group.push(row);
        else byCity.set(key, [row]);
    }

    return [...byCity.values()].map(sites => {
        const bays = sites.reduce((total, site) => total + site.chargerCount, 0);
        const power = Math.max(...sites.map(site => site.maxPowerKw));

        // A city reads as open the moment one of its sites is, which is the honest
        // summary: a driver can charge there today.
        const anyLive = sites.some(site => site.status === 'LIVE');
        const status = anyLive
            ? statusLabelFor('LIVE')
            : statusLabelFor(sites[0].status as StationStatus);

        const single = sites.length === 1 ? sites[0].slug : null;

        const counties = [
            ...new Set(sites.map(site => site.county).filter(Boolean)),
        ];

        return {
            name: sites[0].city,
            region: sites[0].region,
            county: counties.map(name => `${name} County`).join(' / '),
            capacity: `${power}kW Ultra Fast Charging`,
            detail:
                sites.length === 1
                    ? `${bays} charging ${bays === 1 ? 'bay' : 'bays'}`
                    : `${sites.length} sites · ${bays} bays`,
            status,
            siteCount: sites.length,
            slug: single,
            // `q` is the finder's own search parameter, and the hash lands the visitor on
            // the finder rather than at the top of the page.
            href: single
                ? `/locations/${single}`
                : `/locations?q=${encodeURIComponent(sites[0].city)}#locations`,
        };
    });
}
