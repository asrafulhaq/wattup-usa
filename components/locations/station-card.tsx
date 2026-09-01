"use client";

import { AMENITIES } from "@/lib/locations/amenities";
import {
  formatAddress,
  formatConnectors,
  formatPrice,
  statusLabel,
} from "@/lib/locations/public";
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
  const price = formatPrice(station);
  const connectors = formatConnectors(station);

  return (
    <div className="w-[300px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/20 md:w-[320px]">
      <div className="relative p-4 md:p-5">
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

        <Link
          href={`/locations/${station.slug}`}
          className="mt-4 flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          View station
        </Link>
      </div>

      {/* The three things a driver checks before committing to the detour, in the order
          the reference puts them: what fits, how fast, what it costs. County lives in
          the strip and on the station page, where there is room for context. */}
      <dl className="border-t border-black/10 px-4 py-3 text-[14px] md:px-5 md:py-4">
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Connectors</dt>
          <dd className={connectors ? "text-dark/65" : "text-dark/35"}>
            {connectors ?? "Being confirmed"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Speed</dt>
          <dd className="text-dark/65">
            {station.maxPowerKw}kW &middot; {station.chargerCount} bays
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Price</dt>
          <dd className={price ? "text-dark/65" : "text-dark/35"}>
            {price ?? "Being confirmed"}
          </dd>
        </div>
        {/* A row like the others rather than an icon strip that appears only when there
            is something to draw. Hiding it left three fields in the same state showing
            three different things: two saying "being confirmed" and one silently gone. */}
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="font-semibold text-dark">Amenities</dt>
          {amenities.length > 0 ? (
            <dd className="flex flex-wrap items-center justify-end gap-2">
              {amenities.slice(0, 6).map((amenity) => (
                <amenity.icon
                  key={amenity.id}
                  aria-label={amenity.label}
                  className="h-[17px] w-[17px] text-dark/55"
                />
              ))}
              {amenities.length > 6 && (
                <span className="text-[13px] text-dark/45">
                  +{amenities.length - 6}
                </span>
              )}
            </dd>
          ) : (
            <dd className="text-dark/35">Being confirmed</dd>
          )}
        </div>
      </dl>
    </div>
  );
}
