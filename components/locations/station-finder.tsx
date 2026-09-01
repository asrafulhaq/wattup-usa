"use client";

import { MapCanvas } from "@/components/locations/map/map-canvas";
import { SearchBar } from "@/components/locations/search-bar";
import { StationCard } from "@/components/locations/station-card";
import { StationStrip } from "@/components/locations/station-strip";
import { FadeUp } from "@/components/ui/fade-up";
import {
  applyFilters,
  RADIUS_OPTIONS,
  type StationFilters,
} from "@/lib/locations/filters";
import type { PublicStation } from "@/lib/locations/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

interface StationFinderProps {
  stations: PublicStation[];
  mapboxToken: string | null;
}

/**
 * Reads the filter state out of the URL.
 *
 * State lives there rather than in component state so the back button works, a link is
 * shareable, and support can send a customer straight to a station.
 */
function parseFilters(params: URLSearchParams): StationFilters {
  const near = params.get("near");
  const [lat, lon] = (near ?? "").split(",").map(Number);
  const radius = Number(params.get("radius"));
  const years = (params.get("years") ?? "")
    .split(",")
    .map(Number)
    .filter((y) => y === 2026 || y === 2027);

  return {
    query: params.get("q") ?? "",
    near:
      near && Number.isFinite(lat) && Number.isFinite(lon)
        ? { latitude: lat, longitude: lon, label: params.get("label") ?? "Your search" }
        : null,
    radius: RADIUS_OPTIONS.includes(radius as (typeof RADIUS_OPTIONS)[number])
      ? radius
      : null,
    years,
    minChargers: Number(params.get("min")) || 0,
  };
}

function StationFinderInner({ stations, mapboxToken }: StationFinderProps) {
  const params = useSearchParams();
  const router = useRouter();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(params.toString())),
    [params],
  );
  const selectedSlug = params.get("sel");

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      router.replace(query ? `?${query}#locations` : "#locations", { scroll: false });
    },
    [params, router],
  );

  const onFiltersChange = useCallback(
    (patch: Partial<StationFilters>) =>
      write((next) => {
        const set = (key: string, value: string | null) =>
          value ? next.set(key, value) : next.delete(key);

        if ("query" in patch) set("q", patch.query ?? null);
        if ("radius" in patch) set("radius", patch.radius ? String(patch.radius) : null);
        if ("minChargers" in patch)
          set("min", patch.minChargers ? String(patch.minChargers) : null);
        if ("years" in patch)
          set("years", patch.years?.length ? patch.years.join(",") : null);
        if ("near" in patch) {
          if (patch.near) {
            next.set(
              "near",
              `${patch.near.latitude.toFixed(5)},${patch.near.longitude.toFixed(5)}`,
            );
            next.set("label", patch.near.label);
          } else {
            next.delete("near");
            next.delete("label");
          }
        }
        // A new search should not keep a selection that may now be filtered out.
        if ("near" in patch || "query" in patch) next.delete("sel");
      }),
    [write],
  );

  const onSelect = useCallback(
    (slug: string | null) =>
      write((next) => (slug ? next.set("sel", slug) : next.delete("sel"))),
    [write],
  );

  const onReset = useCallback(
    () => write((next) => [...next.keys()].forEach((key) => next.delete(key))),
    [write],
  );

  const ranked = useMemo(() => applyFilters(stations, filters), [stations, filters]);
  const selected = ranked.find((station) => station.slug === selectedSlug) ?? null;

  // Widening to the next radius up is a better offer than "no results": it tells the
  // visitor the network exists, just further away.
  const widerRadius =
    filters.radius === null
      ? null
      : (RADIUS_OPTIONS.find((radius) => radius > filters.radius!) ?? null);

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

        <FadeUp delay={0.15} className="mt-8 md:mt-10">
          <SearchBar
            stations={stations}
            filters={filters}
            mapboxToken={mapboxToken}
            onChange={onFiltersChange}
            onReset={onReset}
          />
        </FadeUp>

        <FadeUp delay={0.2} className="mt-10 md:mt-14">
          <p className="mb-5 text-[13px] font-medium text-dark/45">
            {ranked.length} of {stations.length} locations
            {filters.near ? ` near ${filters.near.label}` : ""}
          </p>
          <StationStrip
            stations={ranked}
            selectedSlug={selectedSlug}
            onSelect={onSelect}
            onHover={setHoveredSlug}
          />
        </FadeUp>

        <div className="relative mt-8 w-full overflow-hidden rounded-lg bg-[#E8EDF4] md:mt-10">
          <MapCanvas
            stations={ranked.length > 0 ? ranked : stations}
            selectedSlug={selectedSlug}
            hoveredSlug={hoveredSlug}
            onSelect={onSelect}
            onHover={setHoveredSlug}
            mapboxToken={mapboxToken}
            className="h-[520px] w-full md:h-[780px]"
          />

          {ranked.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="pointer-events-auto rounded-xl bg-white/95 px-6 py-5 text-center shadow-lg">
                <p className="text-[15px] font-semibold text-dark">
                  No locations match these filters
                </p>
                {widerRadius ? (
                  <button
                    type="button"
                    onClick={() => onFiltersChange({ radius: widerRadius })}
                    className="mt-3 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Widen to {widerRadius} miles
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onReset}
                    className="mt-3 text-[14px] font-semibold text-primary"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {selected && (
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 md:bottom-7 md:left-7">
              <div className="pointer-events-auto">
                <StationCard station={selected} onClose={() => onSelect(null)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StationFinder(props: StationFinderProps) {
  return (
    <Suspense fallback={<div className="h-[600px] w-full bg-[#F7F9FC]" />}>
      <StationFinderInner {...props} />
    </Suspense>
  );
}
