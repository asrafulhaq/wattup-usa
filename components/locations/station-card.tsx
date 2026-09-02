"use client";

import {
  amenityIcon,
  stationAmenities,
  type AmenityOption,
} from "@/lib/locations/amenities";
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
  /** The active amenity catalogue, for resolving the site's ids to labels and icons. */
  amenities: AmenityOption[];
  onClose?: () => void;
}

/**
 * The card for a selected site.
 *
 * It carries what a driver decides on: where it is, whether it is open, how fast it
 * charges, how many bays, and what is on site while they wait. The route into the full
 * station page is the primary action, since the card is deliberately a summary.
 */
export function StationCard({
  station,
  amenities: catalogue,
  onClose,
}: StationCardProps) {
  const amenities = stationAmenities(station.amenities, catalogue);
  const isOpen = station.status === "LIVE";
  const price = formatPrice(station);
  const connectors = formatConnectors(station);

  return (
    <div className="w-[264px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/20 md:w-[320px]">
      <div className="relative p-3.5 md:p-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close station details"
            className="absolute right-2 top-2 rounded-full p-1.5 text-dark/40 transition-colors hover:bg-black/5 hover:text-dark md:right-3 md:top-3"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <h3 className="pr-7 text-[15px] font-bold leading-[125%] tracking-[-0.01em] text-dark md:pr-8 md:text-[18px]">
          {station.name}
        </h3>
        <p className="mt-1 text-[12.5px] leading-[145%] text-primary md:mt-1.5 md:text-[14px]">
          {formatAddress(station)}
        </p>

        <span
          className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold md:mt-3 md:px-2.5 md:py-1 md:text-[12px] ${
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
          className="mt-3 flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover md:mt-4 md:py-2.5 md:text-[14px]"
        >
          View station
        </Link>
      </div>

      {/* The three things a driver checks before committing to the detour, in the order
          the reference puts them: what fits, how fast, what it costs. County lives in
          the strip and on the station page, where there is room for context. */}
      <dl className="border-t border-black/10 px-3.5 py-2.5 text-[12.5px] md:px-5 md:py-4 md:text-[14px]">
        <div className="flex items-baseline justify-between gap-3 py-0.5 md:gap-4 md:py-1">
          <dt className="font-semibold text-dark">Connectors</dt>
          <dd className={connectors ? "text-dark/65" : "text-dark/35"}>
            {connectors ?? "Being confirmed"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-0.5 md:gap-4 md:py-1">
          <dt className="font-semibold text-dark">Speed</dt>
          <dd className="text-dark/65">
            {station.maxPowerKw}kW &middot; {station.chargerCount} bays
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-0.5 md:gap-4 md:py-1">
          <dt className="font-semibold text-dark">Price</dt>
          <dd className={price ? "text-dark/65" : "text-dark/35"}>
            {price ?? "Being confirmed"}
          </dd>
        </div>
        {/* A row like the others rather than an icon strip that appears only when there
            is something to draw. Hiding it left three fields in the same state showing
            three different things: two saying "being confirmed" and one silently gone. */}
        <div className="flex items-baseline justify-between gap-3 py-0.5 md:gap-4 md:py-1">
          <dt className="font-semibold text-dark">Amenities</dt>
          {amenities.length > 0 ? (
            <dd className="flex flex-wrap items-center justify-end gap-2">
              {amenities.slice(0, 6).map((amenity) => {
                const Icon = amenityIcon(amenity.icon);
                return (
                  <Icon
                    key={amenity.id}
                    aria-label={amenity.label}
                    className="h-[15px] w-[15px] text-dark/55 md:h-[17px] md:w-[17px]"
                  />
                );
              })}
              {amenities.length > 6 && (
                <span className="text-[12px] text-dark/45 md:text-[13px]">
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
