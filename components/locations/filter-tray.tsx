"use client";

import { countWith, type StationFilters } from "@/lib/locations/filters";
import type { PublicStation } from "@/lib/locations/types";

interface FilterTrayProps {
  stations: PublicStation[];
  filters: StationFilters;
  onChange: (next: Partial<StationFilters>) => void;
  onReset: () => void;
}

const YEARS = [2026, 2027] as const;
const CHARGER_STEPS = [4, 6, 8] as const;

/**
 * The filter panel that drops out of the search bar.
 *
 * Every option carries the number of sites it would leave. The reference shows bare
 * checkboxes, but without a count a visitor cannot tell which choice empties the list
 * until they have already made it.
 *
 * Amenities are in the reference and deliberately absent here: we hold no amenity data
 * for any site yet. The section is built to take them without a layout change.
 */
export function FilterTray({ stations, filters, onChange, onReset }: FilterTrayProps) {
  return (
    <div className="w-[320px] rounded-xl border border-black/10 bg-white p-5 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-dark/50">
          Opening
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] font-medium text-primary transition-opacity hover:opacity-70"
        >
          Reset all filters
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {YEARS.map((year) => {
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
                Coming {year}
              </span>
              <span className="text-[13px] tabular-nums text-dark/40">{count}</span>
            </label>
          );
        })}
      </div>

      <h3 className="mt-5 text-[13px] font-bold uppercase tracking-[0.08em] text-dark/50">
        Minimum chargers
      </h3>
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
