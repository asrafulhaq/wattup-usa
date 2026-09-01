"use client";

import { FadeUp } from "@/components/ui/fade-up";
import { CaliforniaMap } from "@/components/locations/map/california-map";
import { ResultsList } from "@/components/locations/results-list";
import { StationCard } from "@/components/locations/station-card";
import { haversineMiles } from "@/lib/locations/distance";
import type { PublicStation, RankedStation } from "@/lib/locations/types";
import { useMemo, useState } from "react";

interface StationFinderProps {
  stations: PublicStation[];
}

/**
 * The finder island.
 *
 * State lives here for now. It moves into the URL once the search bar and filters land,
 * so that back works and a link can point at a station.
 */
export function StationFinder({ stations }: StationFinderProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const selected = stations.find((s) => s.slug === selectedSlug) ?? null;

  // Without a search point there is no distance to sort on, so the list falls back to
  // the sooner sites first, then alphabetically. A list in sheet order looks arbitrary.
  const ranked: RankedStation[] = useMemo(
    () =>
      stations
        .map((station) => ({
          ...station,
          distance: selected
            ? haversineMiles(
                selected.latitude,
                selected.longitude,
                station.latitude,
                station.longitude,
              )
            : null,
        }))
        .sort((a, b) => {
          if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
          if (a.goLiveYear !== b.goLiveYear) return a.goLiveYear - b.goLiveYear;
          return a.city.localeCompare(b.city);
        }),
    [stations, selected],
  );

  return (
    <section id="locations" className="w-full bg-[#F7F9FC] py-[40px] md:py-[82px]">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10">
        <FadeUp>
          <h2 className="headline-dark w-full text-left max-md:w-[305px]">
            Explore Our Growing Network
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="text-description mt-6 max-w-3xl text-dark/70 max-md:max-w-full">
            WattUpUSA is strategically expanding its ultra-fast EV charging network
            throughout California&rsquo;s high-traffic retail and commercial corridors
            through a disciplined deployment strategy focused on long-term
            infrastructure growth.
          </p>
        </FadeUp>

        <div className="mt-10 grid gap-6 lg:mt-16 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
          <div className="order-2 lg:order-1 lg:max-h-[620px] lg:overflow-y-auto lg:pr-2">
            <ResultsList
              stations={ranked}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              onHover={setHoveredSlug}
            />
          </div>

          {/* The panel ground matches the stroke drawn between counties, which is what
              separates the land into discrete shapes the way the reference does. */}
          <div className="relative order-1 flex items-center justify-center overflow-hidden rounded-2xl bg-[#F1F4F9] p-4 lg:order-2 lg:p-8">
            <CaliforniaMap
              stations={stations}
              selectedSlug={selectedSlug}
              hoveredSlug={hoveredSlug}
              onSelect={setSelectedSlug}
              onHover={setHoveredSlug}
              className="h-[420px] w-auto md:h-[600px]"
            />
            {/* Selecting centres the station, so the card can sit at a fixed offset
                from the middle: below and to the left, as in the reference. */}
            {selected && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10">
                <div className="pointer-events-auto -translate-x-[calc(100%+18px)] translate-y-[46px]">
                  <StationCard station={selected} onClose={() => setSelectedSlug(null)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
