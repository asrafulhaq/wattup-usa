"use client";

import { formatDistance } from "@/lib/locations/distance";
import { formatAddress, statusLabel } from "@/lib/locations/public";
import type { RankedStation } from "@/lib/locations/types";

interface ResultsListProps {
  stations: RankedStation[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  onWidenSearch?: () => void;
}

/**
 * The list half of the finder. It is not a secondary view of the map: it is the part
 * that works without JavaScript, that a screen reader can move through, and that
 * carries the detail a marker cannot.
 */
export function ResultsList({
  stations,
  selectedSlug,
  onSelect,
  onHover,
  onWidenSearch,
}: ResultsListProps) {
  if (stations.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6 text-center">
        <p className="text-[15px] font-semibold text-dark">
          No stations match these filters
        </p>
        <p className="mt-1 text-[14px] text-dark/60">
          Try a wider distance or clear a filter.
        </p>
        {onWidenSearch && (
          <button
            type="button"
            onClick={onWidenSearch}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Widen the search
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {stations.map((station) => {
        const isSelected = station.slug === selectedSlug;
        return (
          <li key={station.slug}>
            <button
              type="button"
              onClick={() => onSelect(isSelected ? null : station.slug)}
              onMouseEnter={() => onHover(station.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(station.slug)}
              onBlur={() => onHover(null)}
              aria-pressed={isSelected}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-black/10 bg-white hover:border-primary/40"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[16px] font-bold leading-[125%] tracking-[-0.01em] text-dark">
                  {station.city}
                </h3>
                {station.distance !== null && (
                  <span className="shrink-0 text-[13px] font-medium text-dark/50">
                    {formatDistance(station.distance, "mi")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-[140%] text-dark/60">
                {formatAddress(station)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[12px] font-semibold text-dark/70">
                  {station.chargerCount} chargers
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                    station.goLiveYear === 2026
                      ? "bg-primary/10 text-primary"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statusLabel(station)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
