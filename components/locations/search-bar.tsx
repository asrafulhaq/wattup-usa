"use client";

import { FilterTray } from "@/components/locations/filter-tray";
import { geocode } from "@/lib/locations/geocode";
import {
  activeFilterCount,
  RADIUS_OPTIONS,
  type StationFilters,
} from "@/lib/locations/filters";
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
      (position) => {
        setLocate("idle");
        setText("Your location");
        onChange({
          near: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            label: "Your location",
          },
          query: "",
          radius: filters.radius ?? 50,
        });
      },
      // A fair number of people refuse, so this is a normal path, not an error path.
      () => setLocate("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  const filterCount = activeFilterCount(filters);

  return (
    <div ref={containerRef} className="relative w-full">
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
            there is no dead strip between segments. */}
        <label className="relative flex shrink-0 items-center border-l border-black/10 transition-colors hover:bg-black/[0.02]">
          <span className="sr-only">Distance</span>
          <select
            value={filters.radius ?? ""}
            onChange={(event) =>
              onChange({ radius: event.target.value ? Number(event.target.value) : null })
            }
            className="h-full cursor-pointer appearance-none bg-transparent pl-5 pr-10 text-[15px] text-dark outline-none"
          >
            <option value="">Distance</option>
            {RADIUS_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                {miles} mi
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 12 8"
            aria-hidden="true"
            className="pointer-events-none absolute right-4 h-2 w-3 text-dark/45"
          >
            <path
              d="M1 1.5 6 6.5l5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </label>

        <button
          type="button"
          onClick={() => setTrayOpen((open) => !open)}
          aria-expanded={trayOpen}
          aria-controls={trayId}
          aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
          className={`relative flex shrink-0 items-center border-l border-black/10 px-5 transition-colors ${
            trayOpen ? "bg-primary/5 text-primary" : "text-dark/70 hover:bg-black/[0.02] hover:text-dark"
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
          {filterCount > 0 && (
            <span className="absolute right-2.5 top-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
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

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locate === "locating"}
          className="text-[13.5px] font-medium text-primary transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          {locate === "locating" ? "Finding you…" : "Use My Location »"}
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

      {trayOpen && (
        <div id={trayId} className="absolute left-0 top-full z-40 mt-2">
          <FilterTray
            stations={stations}
            filters={filters}
            onChange={onChange}
            onReset={onReset}
          />
        </div>
      )}
    </div>
  );
}
