"use client";

import { MapCanvas } from "@/components/locations/map/map-canvas";
import { SearchBar } from "@/components/locations/search-bar";
import { StationCard } from "@/components/locations/station-card";
import { StationStrip } from "@/components/locations/station-strip";
import { FadeUp } from "@/components/ui/fade-up";
import { AMENITY_IDS, type AmenityId } from "@/lib/locations/amenities";
import { haversineMiles } from "@/lib/locations/distance";
import {
  applyFilters,
  RADIUS_OPTIONS,
  type StationFilters,
} from "@/lib/locations/filters";
import type { PublicStation } from "@/lib/locations/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

/** Matches the .wattup-card-exit animation in globals.css. */
const CARD_EXIT_MS = 180;

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
    amenities: (params.get("amenities") ?? "")
      .split(",")
      .filter((id): id is AmenityId => AMENITY_IDS.includes(id as AmenityId)),
  };
}

function StationFinderInner({ stations, mapboxToken }: StationFinderProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const urlFilters = useMemo(
    () => parseFilters(new URLSearchParams(params.toString())),
    [params],
  );

  /**
   * Filters render from an optimistic copy, not straight from the URL.
   *
   * The URL is the source of truth, but writing to it goes through the router, and a chip
   * that waits for that round-trip before it looks pressed feels broken however fast the
   * filtering itself is. The patch is applied here immediately and the router catches up;
   * when it does, this snaps back to whatever the URL actually says, so a failed or
   * superseded navigation cannot leave the controls lying.
   */
  const [filters, applyOptimistic] = useOptimistic(
    urlFilters,
    (state: StationFilters, patch: Partial<StationFilters>) => ({ ...state, ...patch }),
  );
  const [, startTransition] = useTransition();

  const selectedSlug = params.get("sel");

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      // The path is always written out. "#locations" on its own is resolved against the
      // current URL, query string included, so clearing the last parameter left it in
      // place: Reset all filters appeared to do nothing because the state it wrote was
      // immediately re-read from the URL it had failed to clear.
      const next_url = query ? `${pathname}?${query}#locations` : `${pathname}#locations`;
      router.replace(next_url, { scroll: false });
    },
    [params, pathname, router],
  );

  const onFiltersChange = useCallback(
    (patch: Partial<StationFilters>) =>
      startTransition(() => {
        applyOptimistic(patch);
        write((next) => {
          const set = (key: string, value: string | null) =>
            value ? next.set(key, value) : next.delete(key);

          if ("query" in patch) set("q", patch.query ?? null);
          if ("radius" in patch) set("radius", patch.radius ? String(patch.radius) : null);
          if ("minChargers" in patch)
            set("min", patch.minChargers ? String(patch.minChargers) : null);
          if ("years" in patch)
            set("years", patch.years?.length ? patch.years.join(",") : null);
          if ("amenities" in patch)
            set("amenities", patch.amenities?.length ? patch.amenities.join(",") : null);
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
        });
      }),
    [write, applyOptimistic],
  );

  const onSelect = useCallback(
    (slug: string | null) =>
      write((next) => (slug ? next.set("sel", slug) : next.delete("sel"))),
    [write],
  );

  /**
   * Searches near a station and selects it in the same write.
   *
   * Two separate updates would fight: setting a search point clears the selection, on
   * the reasoning that a new search should not keep a station that may now be filtered
   * out. That is right when someone types a place and wrong when they pick a station by
   * name, so this writes both at once.
   */
  const onPickStation = useCallback(
    (station: PublicStation) =>
      write((next) => {
        next.set(
          "near",
          `${station.latitude.toFixed(5)},${station.longitude.toFixed(5)}`,
        );
        next.set("label", `${station.city}, ${station.region}`);
        next.set("sel", station.slug);
        next.delete("q");
      }),
    [write],
  );

  const onReset = useCallback(
    () =>
      startTransition(() => {
        applyOptimistic({
          years: [],
          minChargers: 0,
          radius: null,
          amenities: [],
          query: "",
          near: null,
        });
        write((next) => [...next.keys()].forEach((key) => next.delete(key)));
      }),
    [write, applyOptimistic],
  );

  const ranked = useMemo(() => applyFilters(stations, filters), [stations, filters]);
  const selected = ranked.find((station) => station.slug === selectedSlug) ?? null;

  /**
   * Keeps the card on screen for the length of its exit animation.
   *
   * Clearing the selection unmounts the card immediately, which would cut the animation
   * off at the first frame. The station is held here for as long as the exit runs and
   * then released.
   */
  const [closing, setClosing] = useState<PublicStation | null>(null);
  const cardStation = selected ?? closing;

  const closeCard = useCallback(() => {
    if (selected) setClosing(selected);
    onSelect(null);
    window.setTimeout(() => setClosing(null), CARD_EXIT_MS);
  }, [selected, onSelect]);

  /**
   * The closest station to the search point, ignoring every filter.
   *
   * An empty result usually is not "nothing matches": it is that the visitor is further
   * from the network than the distance filter allows. Naming the nearest station and how
   * far it is answers the question they actually asked, and matters most for someone
   * outside California entirely, where every radius on the list comes back empty.
   */
  const nearest = useMemo(() => {
    if (!filters.near || stations.length === 0) return null;
    return stations
      .map((station) => ({
        station,
        miles: haversineMiles(
          filters.near!.latitude,
          filters.near!.longitude,
          station.latitude,
          station.longitude,
        ),
      }))
      .sort((a, b) => a.miles - b.miles)[0];
  }, [stations, filters.near]);

  // Widening to the next radius up is a better offer than "no results": it tells the
  // visitor the network exists, just further away.
  const widerRadius =
    filters.radius === null
      ? null
      : (RADIUS_OPTIONS.find((radius) => radius > filters.radius!) ?? null);

  /** Past the widest radius on offer, the only useful move is to drop the limit. */
  const nearestBeyondRadius =
    nearest !== null &&
    filters.radius !== null &&
    nearest.miles > filters.radius;

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

        {/* Above the strip: the filter tray drops out of the bar and would otherwise be
            painted over, since the strip is a later sibling with its own stacking
            context and z-index alone cannot reach across that. */}
        <FadeUp delay={0.15} className="relative z-30 mt-8 md:mt-10">
          <SearchBar
            stations={stations}
            filters={filters}
            mapboxToken={mapboxToken}
            onChange={onFiltersChange}
            onPick={onPickStation}
            onReset={onReset}
          />
        </FadeUp>

        <FadeUp delay={0.2} className="relative z-10 mt-10 md:mt-14">
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
              <div className="pointer-events-auto max-w-[320px] rounded-xl bg-white/95 px-6 py-5 text-center shadow-lg">
                {nearestBeyondRadius ? (
                  <>
                    <p className="text-[15px] font-semibold text-dark">
                      Nothing within {filters.radius} miles of you
                    </p>
                    <p className="mt-1 text-[14px] leading-[140%] text-dark/60">
                      The nearest is {nearest.station.name} in{" "}
                      {nearest.station.city}, {Math.round(nearest.miles)} miles away.
                    </p>
                    <button
                      type="button"
                      onClick={() => onFiltersChange({ radius: null })}
                      className="mt-4 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                      Show it anyway
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[15px] font-semibold text-dark">
                      No locations match these filters
                    </p>
                    {widerRadius ? (
                      <button
                        type="button"
                        onClick={() => onFiltersChange({ radius: widerRadius })}
                        className="mt-4 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
                      >
                        Widen to {widerRadius} miles
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onReset}
                        className="mt-4 text-[14px] font-semibold text-primary"
                      >
                        Clear filters
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rendered whenever a station is selected, or while one is on its way out.
              The exit is driven by a short timer rather than by an animation library:
              the card previously mounted through AnimatePresence and stayed at its
              initial keyframe, leaving it invisible but still in the tree, which is why
              its close button could not be clicked. */}
          {cardStation && (
            <div className="pointer-events-none absolute bottom-10 left-3 right-3 z-10 flex justify-start md:bottom-12 md:left-7 md:right-auto">
              <div
                className={`pointer-events-auto ${
                  closing ? "wattup-card-exit" : "wattup-card-enter"
                }`}
              >
                <StationCard station={cardStation} onClose={closeCard} />
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
