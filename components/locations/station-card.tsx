"use client";

import { formatAddress, statusLabel } from "@/lib/locations/public";
import type { PublicStation } from "@/lib/locations/types";

interface StationCardProps {
  station: PublicStation;
  onClose?: () => void;
}

/**
 * The card for a selected site.
 *
 * Follows the reference: a flat block of the accent colour with a small radius, a bold
 * name and a quieter line beneath, and a mark on the right. No large radius and no drop
 * shadow, both of which soften it away from the reference's look. The accent is WattUp
 * blue where the reference uses orange.
 */
export function StationCard({ station, onClose }: StationCardProps) {
  return (
    <div className="relative w-[268px] rounded-[6px] bg-primary px-4 py-3.5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-bold leading-[125%] tracking-[-0.01em]">
            {station.name}
          </h3>
          <p className="mt-0.5 text-[12.5px] leading-[140%] text-white/75">
            {formatAddress(station)}
          </p>
          <p className="mt-2 text-[12.5px] font-semibold leading-[140%] text-white/90">
            {station.maxPowerKw}kW &middot; {station.chargerCount} chargers &middot;{" "}
            {statusLabel(station)}
          </p>
        </div>

        <span aria-hidden="true" className="mt-0.5 shrink-0 text-white/45">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
            <path d="M10 1.6a5.7 5.7 0 0 0-5.7 5.7c0 4.1 5.05 10.4 5.27 10.67a.56.56 0 0 0 .86 0c.22-.27 5.27-6.57 5.27-10.67A5.7 5.7 0 0 0 10 1.6Zm0 8.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
          </svg>
        </span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close station details"
          className="absolute -right-2 -top-2 rounded-full bg-primary p-1.5 text-white/80 ring-2 ring-[#F1F4F9] transition-colors hover:text-white"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
            <path
              d="M2 2l12 12M14 2L2 14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
