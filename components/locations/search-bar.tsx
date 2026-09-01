"use client";

import { FilterTray } from "@/components/locations/filter-tray";
import { geocode, reverseGeocode } from "@/lib/locations/geocode";
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
import { resolveSearchPoint, type SearchPoint } from "@/lib/locations/search";
import type { PublicStation } from "@/lib/locations/types";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface SearchBarProps {
  stations: PublicStation[];
  filters: StationFilters;
  mapboxToken: string | null;
  onChange: (next: Partial<StationFilters>) => void;
  onReset: () => void;
}

type LocateState = "idle" | "locating" | "denied" | "unavailable";

/** Applied when the visitor asks for stations near them and has set no distance. */
const DEFAULT_NEARBY_RADIUS = 50;

/**
 * The four segment bar from the reference: address or postcode, distance, filters,
 * submit, with "use my location" beneath.
 */
export function SearchBar({
  stations,
  filters,
  mapboxToken,
  onChange,
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
  const [locate, setLocate] = useState<LocateState>("idle");
  const trayId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  /** Distance from the bar's right edge to the filter button's, so the tray lines up. */
  const [trayRight, setTrayRight] = useState(0);

  // Local matching answers the common queries and is a pure function of what we already
  // hold, so it is derived during render rather than pushed through an effect.
  const local = useMemo(
    () => (text.trim().length >= 3 ? resolveSearchPoint(text, stations) : null),
    [text, stations],
  );

  // Only when local finds nothing do we spend a geocoding call, debounced so that
  // typing does not bill one request per keystroke.
  useEffect(() => {
    const query = text.trim();
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
  }, [text, local, mapboxToken]);

  const suggestions = local
    ? [local]
    : remote.query === text.trim()
      ? remote.points
      : [];

  useEffect(() => {
    if (!trayOpen) return;
    const container = containerRef.current;
    const button = filterButtonRef.current;
    if (container && button) {
      setTrayRight(
        container.getBoundingClientRect().right - button.getBoundingClientRect().right,
      );
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setTrayOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTrayOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [trayOpen]);

  const submit = () => {
    const point = suggestions[0] ?? resolveSearchPoint(text, stations);
    onChange(point ? { near: point, query: "" } : { near: null, query: text });
  };

  const useMyLocation = () => {
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
        const radius = filters.radius ?? DEFAULT_NEARBY_RADIUS;
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

  return (
    <div ref={containerRef} className="relative w-full">
      {/* The tray hangs off this row, not off the outer block. The outer block also holds
          the links beneath the bar, so anchoring to it dropped the tray a whole row lower
          than the control that opens it. */}
      <div className="relative">
      <div className="flex h-14 w-full items-stretch overflow-hidden rounded-full border border-black/10 bg-white shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Address / Zip"
          aria-label="Search by address or postcode"
          className="min-w-0 flex-1 bg-transparent px-6 text-[15px] text-dark outline-none placeholder:text-dark/40"
        />

        {/* Each control fills the bar's full height, so the dividers run edge to edge and
            there is no dead strip between segments. The trigger is stripped back to a
            plain segment: it lives inside the bar rather than being a control on top of
            it, so it carries no border, radius or shadow of its own. */}
        <div className="flex shrink-0 items-stretch border-l border-black/10">
          <Select
            value={filters.radius ? String(filters.radius) : "any"}
            onValueChange={(value) =>
              onChange({ radius: value === "any" ? null : Number(value) })
            }
          >
            <SelectTrigger
              aria-label="Distance"
              className="h-full w-[152px] rounded-none border-0 bg-transparent px-5 text-[15px] text-dark shadow-none transition-colors hover:bg-black/[0.02] focus-visible:ring-0 data-[size=default]:h-full"
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
          className={`relative flex shrink-0 items-center gap-2 border-l border-black/10 px-6 text-[15px] transition-colors ${
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
          className="shrink-0 bg-primary px-8 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Go
        </button>
      </div>

        {/* Anchored to the filter button rather than to the bar's left edge, so the panel
            reads as belonging to the control that opened it. */}
        {trayOpen && (
          <div
            id={trayId}
            style={{ right: trayRight }}
            className="absolute top-full z-40 mt-2"
          >
            <FilterTray
              stations={stations}
              filters={filters}
              onChange={onChange}
              onReset={onReset}
            />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locate === "locating"}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M10 1.6a5.7 5.7 0 0 0-5.7 5.7c0 4.1 5.05 10.4 5.27 10.67a.56.56 0 0 0 .86 0c.22-.27 5.27-6.57 5.27-10.67A5.7 5.7 0 0 0 10 1.6Zm0 8.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
          </svg>
          {locate === "locating" ? "Finding you\u2026" : "Use My Location \u00bb"}
        </button>
        {locate === "denied" && (
          <span className="text-[13px] text-dark/55">
            Location permission was declined. Type a city or postcode instead.
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
            className="text-[13px] text-dark/55 underline underline-offset-2 hover:text-dark"
          >
            Clear &ldquo;{filters.near.label}&rdquo;
          </button>
        )}
      </div>
    </div>
  );
}
