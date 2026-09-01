"use client";

import { AMENITIES } from "@/lib/locations/amenities";
import { formatAddress, statusLabel } from "@/lib/locations/public";
import type { PublicStation } from "@/lib/locations/types";
import Link from "next/link";

interface StationCardProps {
  station: PublicStation;
  onClose?: () => void;
}

/**
 * The card for a selected site.
 *
 * It carries what a driver decides on: where it is, whether it is open, how fast it
 * charges, how many bays, and what is on site while they wait. The route into the full
 * station page is the primary action, since the card is deliberately a summary.
 */
export function StationCard({ station, onClose }: StationCardProps) {
  const amenities = AMENITIES.filter((amenity) =>
    station.amenities.includes(amenity.id),
  );
  const isOpen = station.status === "LIVE";

  return (
    <div className="w-[320px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/20">
      <div className="relative p-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close station details"
            className="absolute right-3 top-3 rounded-full p-1.5 text-dark/40 transition-colors hover:bg-black/5 hover:text-dark"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <h3 className="pr-8 text-[18px] font-bold leading-[125%] tracking-[-0.01em] text-dark">
          {station.name}
        </h3>
        <p className="mt-1.5 text-[14px] leading-[145%] text-primary">
          {formatAddress(station)}
        </p>

        <span
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            isOpen ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-primary" : "bg-amber-500"}`}
          />
          {statusLabel(station)}
        </span>

        {amenities.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            {amenities.map((amenity) => (
              <amenity.icon
                key={amenity.id}
                aria-label={amenity.label}
                className="h-[18px] w-[18px] text-dark/50"
              />
            ))}
          </div>
        )}

        <Link
          href={`/locations/${station.slug}`}
          className="mt-4 flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          View station
        </Link>
      </div>

      <dl className="border-t border-black/10 px-5 py-4 text-[14px]">
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Charging speed</dt>
          <dd className="text-dark/65">{station.maxPowerKw}kW</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Chargers</dt>
          <dd className="text-dark/65">{station.chargerCount}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">County</dt>
          <dd className="text-dark/65">{station.county}</dd>
        </div>
      </dl>
    </div>
  );
}
