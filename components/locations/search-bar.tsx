"use client";

import { FilterTray } from "@/components/locations/filter-tray";
import type { AmenityOption } from "@/lib/locations/amenities";
import { geocode, reverseGeocode } from "@/lib/locations/geocode";
import { statusLabel } from "@/lib/locations/public";
import {
  activeFilterCount,
  RADIUS_OPTIONS,
  type StationFilters,
} from "@/lib/locations/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  matchStations,
  resolveSearchPoint,
  type SearchPoint,
} from "@/lib/locations/search";
import type { PublicStation } from "@/lib/locations/types";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

interface SearchBarProps {
  stations: PublicStation[];
  /** The active amenity catalogue, for the filter tray. */
  amenities: AmenityOption[];
  filters: StationFilters;
  mapboxToken: string | null;
  onChange: (next: Partial<StationFilters>) => void;
  /** Search near this station and select it, in one step. */
  onPick: (station: PublicStation) => void;
  onReset: () => void;
}

type LocateState = "idle" | "locating" | "denied" | "unavailable";

/** Applied when the visitor asks for stations near them and has set no distance. */
const DEFAULT_NEARBY_RADIUS = 50;

/** How many stations the dropdown offers, browsing or searching. */
const SUGGESTION_LIMIT = 10;

/**
 * Keeps a panel mounted for the length of its exit animation.
 *
 * Unmounting the moment it closes cuts the animation off at its first frame, so the
 * panel would simply disappear however carefully the keyframes were written.
 *
 * The open state is adjusted during render rather than in an effect, and the close waits
 * on the animation itself rather than on a timer that has to be kept in step with the
 * stylesheet. Under reduced motion the keyframes run for a millisecond instead of being
 * switched off, so this still fires and the panel still unmounts.
 */
function usePanel(open: boolean) {
  const [visible, setVisible] = useState(open);
  if (open && !visible) setVisible(true);

  return {
    mounted: open || visible,
    className: open ? "wattup-pop-enter" : "wattup-pop-exit",
    onAnimationEnd: () => {
      if (!open) setVisible(false);
    },
  };
}

/**
 * The four segment bar from the reference: address or postcode, distance, filters,
 * submit, with "use my location" beneath.
 */
export function SearchBar({
  stations,
  amenities,
  filters,
  mapboxToken,
  onChange,
  onPick,
  onReset,
}: SearchBarProps) {
  const [text, setText] = useState(filters.near?.label ?? filters.query);
  // Remote results are tagged with the query that produced them, so a stale response
  // for an earlier query is simply not read rather than needing to be cleared.
  const [remote, setRemote] = useState<{ query: string; points: SearchPoint[] }>({
    query: "",
    points: [],
  });
  const [trayOpen, setTrayOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [locate, setLocate] = useState<LocateState>("idle");
  const trayId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Lines the filter tray up under the button that opened it.
   *
   * A callback ref rather than state: the offset is a measurement, and holding it in
   * state meant setting state from an effect on every open, which cascades a render for
   * a number that never reaches React's output.
   */
  const positionTray = useCallback((node: HTMLDivElement | null) => {
    const container = containerRef.current;
    const button = filterButtonRef.current;
    if (!node || !container || !button) return;

    const bar = container.getBoundingClientRect();
    // Below the breakpoint the controls sit on their own row, so anchoring the panel to
    // the filter button would push it off the side. It spans the bar instead.
    node.style.right = bar.width < 768 ? "0px" : `${bar.right - button.getBoundingClientRect().right}px`;
  }, []);

  /**
   * The text the dropdown reads, held one step behind the input.
   *
   * The field itself stays immediate, so typing never feels laggy; only the suggestions
   * wait. Without this the list reflowed on every keystroke, which is both distracting
   * and a wasted match over 27 stations per character.
   */
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(text.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [text]);

  // Local matching answers the common queries and is a pure function of what we already
  // hold, so it is derived during render rather than pushed through an effect.
  const local = useMemo(
    () => (debounced.length >= 3 ? resolveSearchPoint(debounced, stations) : null),
    [debounced, stations],
  );

  // Only when local finds nothing do we spend a geocoding call, debounced so that
  // typing does not bill one request per keystroke.
  useEffect(() => {
    const query = debounced;
    if (query.length < 3 || local || !mapboxToken) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      geocode(query, { token: mapboxToken, signal: controller.signal })
        .then((points) => setRemote({ query, points }))
        .catch((error: unknown) => {
          if ((error as Error)?.name !== "AbortError") setRemote({ query, points: [] });
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [debounced, local, mapboxToken]);

  /**
   * What the dropdown lists.
   *
   * With nothing typed it opens on the first ten stations rather than staying empty. An
   * empty menu teaches the visitor nothing about what can be searched, and most people
   * arriving at a network this size want to browse it before they want to filter it.
   */
  const stationMatches = useMemo(
    () =>
      debounced.length >= 2
        ? matchStations(debounced, stations, SUGGESTION_LIMIT)
        : stations.slice(0, SUGGESTION_LIMIT),
    [debounced, stations],
  );

  /** Places, only consulted when nothing we hold matches. */
  const places = remote.query === debounced ? remote.points : [];

  const suggestions = local ? [local] : places;

  useEffect(() => {
    if (!trayOpen && !open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setTrayOpen(false);
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTrayOpen(false);
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [trayOpen, open]);

  const applyStation = (station: PublicStation) => {
    setText(station.city);
    setOpen(false);
    // Picking a station from the list is choosing it, not just searching near it. It
    // becomes the selected station too, so the map centres on it and its card opens
    // rather than the visitor having to find and click the marker they just named.
    onPick(station);
  };

  const applyPlace = (point: SearchPoint) => {
    setText(point.label);
    setOpen(false);
    onChange({ near: point, query: "" });
  };

  const submit = () => {
    setOpen(false);
    if (stationMatches.length > 0 && debounced.length >= 2 && !local) {
      applyStation(stationMatches[0]);
      return;
    }
    const point = suggestions[0] ?? resolveSearchPoint(text, stations);
    onChange(point ? { near: point, query: "" } : { near: null, query: text });
  };

  const requestMyLocation = (withRadius?: number) => {
    if (!navigator.geolocation) {
      setLocate("unavailable");
      return;
    }
    setLocate("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Apply the point immediately so the map moves without waiting on a request,
        // then replace the placeholder label once the address comes back.
        const provisional = "Your location";
        setLocate("idle");
        setText(provisional);

        // A radius is applied, and it is what makes the result honest. Without one the
        // list happily returns every site sorted by distance, which for someone outside
        // the network means entries "7661 mi away": technically sorted, useless to read.
        // With it, the empty state says nothing is near and names the closest station.
        const radius = withRadius ?? filters.radius ?? DEFAULT_NEARBY_RADIUS;
        onChange({ near: { latitude, longitude, label: provisional }, query: "", radius });

        if (!mapboxToken) return;
        try {
          const label = await reverseGeocode(latitude, longitude, { token: mapboxToken });
          if (!label) return;
          setText(label);
          onChange({ near: { latitude, longitude, label }, query: "", radius });
        } catch {
          // Keep the provisional label: the point itself is already correct.
        }
      },
      // A fair number of people refuse, so this is a normal path, not an error path.
      () => setLocate("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  const filterCount = activeFilterCount(filters);
  const suggestionsOpen =
    open && (stationMatches.length > 0 || places.length > 0);
  const suggestionPanel = usePanel(suggestionsOpen);
  const trayPanel = usePanel(trayOpen);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* The tray hangs off this row, not off the outer block. The outer block also holds
          the links beneath the bar, so anchoring to it dropped the tray a whole row lower
          than the control that opens it. */}
      <div className="relative">
      {/* One pill from md up. Below that it stacks: at phone widths the four segments
          left the address field a sliver a few characters wide, which is the one part
          of the bar that needs room. */}
      <div className="flex w-full flex-col gap-2 md:h-14 md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:rounded-full md:border md:border-black/10 md:bg-white md:shadow-sm md:transition-shadow md:focus-within:border-primary/40 md:focus-within:shadow-md">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Address / Zip"
          aria-label="Search by address or postcode"
          className="h-12 w-full rounded-full border border-black/10 bg-white px-5 text-[15px] text-dark shadow-sm outline-none transition-shadow placeholder:text-dark/40 focus:border-primary/40 md:h-auto md:min-w-0 md:flex-1 md:rounded-none md:border-0 md:px-6 md:shadow-none"
        />

        {/* Each control fills the bar's full height, so the dividers run edge to edge and
            there is no dead strip between segments. The trigger is stripped back to a
            plain segment: it lives inside the bar rather than being a control on top of
            it, so it carries no border, radius or shadow of its own. */}
        <div className="flex h-12 items-stretch gap-2 md:contents">
        <div className="flex min-w-0 flex-1 items-stretch rounded-full border border-black/10 bg-white shadow-sm md:h-auto md:flex-none md:rounded-none md:border-0 md:border-l md:border-black/10 md:shadow-none">
          <Select
            value={filters.radius ? String(filters.radius) : "any"}
            onValueChange={(value) => {
              const radius = value === "any" ? null : Number(value);
              onChange({ radius });
              // A radius has nothing to measure from without an origin, so choosing one
              // with no location set filtered nothing and looked broken. Asking where
              // they are is the step they were always going to have to take.
              if (radius !== null && !filters.near) requestMyLocation(radius);
            }}
          >
            <SelectTrigger
              aria-label="Distance"
              className="h-full w-full min-w-0 rounded-full border-0 bg-transparent px-4 text-[15px] text-dark shadow-none transition-colors hover:bg-black/[0.02] focus-visible:ring-0 data-[size=default]:h-full md:w-[152px] md:rounded-none md:px-5"
            >
              <SelectValue placeholder="Distance" />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[152px]">
              <SelectItem value="any">Any distance</SelectItem>
              {RADIUS_OPTIONS.map((miles) => (
                <SelectItem key={miles} value={String(miles)}>
                  Within {miles} mi
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          ref={filterButtonRef}
          type="button"
          onClick={() => setTrayOpen((open) => !open)}
          aria-expanded={trayOpen}
          aria-controls={trayId}
          aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
          className={`relative flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-[15px] shadow-sm transition-colors md:rounded-none md:border-0 md:border-l md:border-black/10 md:px-6 md:shadow-none ${
            trayOpen
              ? "bg-primary/5 text-primary"
              : "text-dark/70 hover:bg-black/[0.02] hover:text-dark"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M2.5 5.5h11M2.5 10h8M2.5 14.5h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="16" cy="5.5" r="1.6" fill="currentColor" />
            <circle cx="13" cy="10" r="1.6" fill="currentColor" />
            <circle cx="10" cy="14.5" r="1.6" fill="currentColor" />
          </svg>
          <span className="hidden md:inline">Filters</span>
          {filterCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
              {filterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-full bg-primary px-7 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover md:rounded-none md:px-8"
        >
          Go
        </button>
        </div>
      </div>

        {/* Typeahead. Stations we hold come first and cost nothing to match; places from
            the geocoder only appear when nothing local fits, which keeps the common
            query off the network entirely. */}
        {suggestionPanel.mounted && (
          <ul
            role="listbox"
            aria-label="Search suggestions"
            className={`absolute left-0 top-full z-50 mt-2 max-h-[380px] w-full max-w-[520px] overflow-y-auto rounded-xl border border-black/10 bg-white py-1.5 shadow-2xl shadow-black/10 ${suggestionPanel.className}`}
            onAnimationEnd={suggestionPanel.onAnimationEnd}
          >
            {debounced.length < 2 && stationMatches.length > 0 && (
              <li
                aria-hidden="true"
                className="px-4 pb-1 pt-1 text-[12px] font-semibold text-dark/40"
              >
                All locations
              </li>
            )}

            {stationMatches.map((match) => (
              <li key={match.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => applyStation(match)}
                  className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      match.status === "LIVE"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M10 1.6a5.7 5.7 0 0 0-5.7 5.7c0 4.1 5.05 10.4 5.27 10.67a.56.56 0 0 0 .86 0c.22-.27 5.27-6.57 5.27-10.67A5.7 5.7 0 0 0 10 1.6Zm0 8.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                    </svg>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[15px] font-semibold text-dark">
                        {match.city}
                      </span>
                      <span
                        className={`shrink-0 text-[12px] font-semibold ${
                          match.status === "LIVE" ? "text-primary" : "text-amber-700"
                        }`}
                      >
                        {statusLabel(match)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-dark/60">
                      {match.street}, {match.city}, {match.region} {match.postalCode}
                    </span>
                    <span className="mt-1 block truncate text-[12.5px] text-dark/45">
                      {match.maxPowerKw}kW &middot; {match.chargerCount} chargers &middot;{" "}
                      {match.county} County
                    </span>
                  </span>
                </button>
              </li>
            ))}

            {places.length > 0 && stationMatches.length > 0 && (
              <li aria-hidden="true" className="my-1.5 border-t border-black/10" />
            )}

            {places.map((place) => (
              <li key={`${place.latitude},${place.longitude},${place.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => applyPlace(place)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-dark/50">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="min-w-0 truncate text-[15px] text-dark">
                    {place.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Anchored to the filter button rather than to the bar's left edge, so the panel
            reads as belonging to the control that opened it. */}
        {trayPanel.mounted && (
          <div
            id={trayId}
            ref={positionTray}
            className={`absolute top-full z-40 mt-2 ${trayPanel.className}`}
            onAnimationEnd={trayPanel.onAnimationEnd}
          >
            <FilterTray
              stations={stations}
              amenities={amenities}
              filters={filters}
              onChange={onChange}
              onReset={onReset}
            />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 px-0.5">
        <button
          type="button"
          onClick={() => requestMyLocation()}
          disabled={locate === "locating"}
          // Matched to the Clear control beside it: same size, shape, padding and
          // hover. One was a blue link and the other underlined grey text, so two
          // controls doing the same kind of job looked unrelated.
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13.5px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M10 1.6a5.7 5.7 0 0 0-5.7 5.7c0 4.1 5.05 10.4 5.27 10.67a.56.56 0 0 0 .86 0c.22-.27 5.27-6.57 5.27-10.67A5.7 5.7 0 0 0 10 1.6Zm0 8.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
          </svg>
          {locate === "locating" ? "Finding you\u2026" : "Use my location"}
        </button>
        {locate === "denied" && (
          <span className="text-[13px] text-dark/55">
            Location permission was declined. Search a city or postcode to filter by
            distance.
          </span>
        )}
        {filters.radius !== null && !filters.near && locate !== "denied" && (
          <span className="text-[13px] text-dark/55">
            Distance needs a starting point. Search a place, or use your location.
          </span>
        )}
        {locate === "unavailable" && (
          <span className="text-[13px] text-dark/55">
            This browser cannot share a location.
          </span>
        )}
        {filters.near && (
          <button
            type="button"
            onClick={() => {
              setText("");
              onChange({ near: null, query: "" });
            }}
            // Matched to the control beside it: same size, same shape, same hover.
            // One was a blue link with an icon and the other underlined grey text, so
            // two controls doing the same kind of job looked unrelated.
            className="inline-flex max-w-[280px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13.5px] font-medium text-dark/55 transition-colors hover:bg-black/[0.06] hover:text-dark"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
              <path
                d="M2.5 2.5l11 11M13.5 2.5l-11 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="truncate">Clear {filters.near.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
