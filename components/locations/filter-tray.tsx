"use client";

import { amenityIcon, type AmenityOption } from "@/lib/locations/amenities";
import { countWith, type StationFilters } from "@/lib/locations/filters";
import type { PublicStation } from "@/lib/locations/types";
import { useMemo } from "react";

interface FilterTrayProps {
  stations: PublicStation[];
  /** The active amenity catalogue, read from the database. */
  amenities: AmenityOption[];
  filters: StationFilters;
  onChange: (next: Partial<StationFilters>) => void;
  onReset: () => void;
}

const CHARGER_STEPS = [4, 6, 8] as const;

/**
 * The availability options, derived from the sites actually present.
 *
 * The year is what the filter stores; the label is what it means to a visitor. Both come
 * from the data rather than from a hardcoded pair, because install years are set per site
 * in the dashboard and a fixed list silently drops a site the moment one is set to 2028.
 *
 * A year whose sites are all open reads "Open", one where none are reads "Coming soon",
 * and a year that is part way through reads as the year itself, which is never wrong.
 */
function availabilityOptions(stations: PublicStation[]) {
  const years = [...new Set(stations.map((station) => station.goLiveYear))].sort(
    (a, b) => a - b,
  );

  return years.map((year) => {
    const inYear = stations.filter((station) => station.goLiveYear === year);
    const open = inYear.filter((station) => station.status === "LIVE").length;

    if (open === inYear.length) return { year, label: "Open" };
    if (open === 0) return { year, label: "Coming soon" };
    return { year, label: String(year) };
  });
}

/**
 * The filter panel that drops out of the search bar.
 *
 * Every option carries the number of sites it would leave. The reference shows bare
 * checkboxes, but without a count a visitor cannot tell which choice empties the list
 * until they have already made it.
 *
 * The amenity catalogue is passed in rather than imported: the client edits it in the
 * dashboard, so a renamed label has to reach here without a deploy.
 */
export function FilterTray({
  stations,
  amenities,
  filters,
  onChange,
  onReset,
}: FilterTrayProps) {
  const availability = useMemo(() => availabilityOptions(stations), [stations]);

  return (
    <div className="max-h-[70vh] w-[400px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-black/10 bg-white p-5 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-dark">Availability</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] font-medium text-primary transition-opacity hover:opacity-70"
        >
          Reset all filters
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {availability.map(({ year, label }) => {
          const checked = filters.years.includes(year);
          const count = countWith(stations, filters, { years: [year] });
          return (
            <label
              key={year}
              className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-dark"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      years: checked
                        ? filters.years.filter((y) => y !== year)
                        : [...filters.years, year],
                    })
                  }
                  className="h-4 w-4 accent-primary"
                />
                {label}
              </span>
              <span className="text-[13px] tabular-nums text-dark/40">{count}</span>
            </label>
          );
        })}
      </div>

      <h3 className="mt-6 text-[14px] font-bold text-dark">Minimum chargers</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip
          label="Any"
          active={filters.minChargers === 0}
          count={countWith(stations, filters, { minChargers: 0 })}
          onClick={() => onChange({ minChargers: 0 })}
        />
        {CHARGER_STEPS.map((step) => (
          <FilterChip
            key={step}
            label={`${step}+`}
            active={filters.minChargers === step}
            count={countWith(stations, filters, { minChargers: step })}
            onClick={() => onChange({ minChargers: step })}
          />
        ))}
      </div>

      <h3 className="mt-6 text-[14px] font-bold text-dark">Amenities</h3>
      <p className="mt-0.5 text-[13px] text-dark/45">A site must have all you pick.</p>
      {/* Every amenity stays selectable even at a count of zero.
          Disabling on zero looked reasonable and was wrong here: no site has been
          surveyed yet, so every count is zero and the whole section arrived dead, with
          nothing to say why. A count of zero is information, not a reason to take the
          control away. */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {amenities.map((amenity) => {
          const checked = filters.amenities.includes(amenity.id);
          const count = countWith(stations, filters, { amenities: [amenity.id] });
          const Icon = amenityIcon(amenity.icon);
          return (
            <label
              key={amenity.id}
              className="flex cursor-pointer items-center justify-between gap-2 text-[14px] text-dark"
            >
              {/* No truncation. The longest labels, Vending Machine and Step-free
                  Access, were being cut to an ellipsis in a 340px panel. The panel is
                  wider and the labels are allowed their full width. */}
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      amenities: checked
                        ? filters.amenities.filter((id) => id !== amenity.id)
                        : [...filters.amenities, amenity.id],
                    })
                  }
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <Icon
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 ${checked ? "text-primary" : "text-dark/45"}`}
                />
                <span className="whitespace-nowrap">{amenity.label}</span>
              </span>
              <span className="shrink-0 text-[13px] tabular-nums text-dark/35">
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const empty = count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : empty
            ? "cursor-not-allowed border-black/5 text-dark/25"
            : "border-black/10 text-dark/70 hover:border-primary/40"
      }`}
    >
      {label}
      <span className={`ml-1.5 tabular-nums ${active ? "text-white/70" : "text-dark/35"}`}>
        {count}
      </span>
    </button>
  );
}
