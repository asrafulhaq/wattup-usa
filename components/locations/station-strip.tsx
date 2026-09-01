"use client";

import { formatDistance } from "@/lib/locations/distance";
import { statusLabel } from "@/lib/locations/public";
import type { RankedStation } from "@/lib/locations/types";
import { useLayoutEffect, useRef } from "react";

interface StationStripProps {
  stations: RankedStation[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
}

/**
 * The horizontal strip of locations above the map, with the accent bar that slides
 * between them.
 *
 * The reference lays each entry out as a name, a quiet region line, then two data lines.
 * Ours reads city, state, charger count, opening. Selecting one re-centres the map.
 *
 * The indicator is positioned by writing to the element's style in a layout effect
 * rather than by holding measurements in state: a measurement is not application state,
 * and keeping it out of the render loop avoids a second pass on every resize.
 */
export function StationStrip({
  stations,
  selectedSlug,
  onSelect,
  onHover,
}: StationStripProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const activeSlug = selectedSlug ?? stations[0]?.slug ?? null;

  useLayoutEffect(() => {
    const move = () => {
      const list = listRef.current;
      const bar = barRef.current;
      if (!list || !bar || !activeSlug) return;
      const tab = list.querySelector<HTMLElement>(`[data-slug="${CSS.escape(activeSlug)}"]`);
      if (!tab) return;
      bar.style.width = `${tab.offsetWidth}px`;
      bar.style.transform = `translateX(${tab.offsetLeft}px)`;
    };

    move();
    const observer = new ResizeObserver(move);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [activeSlug, stations]);

  if (stations.length === 0) return null;

  return (
    <div className="w-full">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Charging locations"
        className="flex w-full gap-5 overflow-x-auto pb-8 [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {stations.map((station) => {
          const isActive = station.slug === activeSlug;
          return (
            <button
              key={station.slug}
              data-slug={station.slug}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(station.slug)}
              onMouseEnter={() => onHover(station.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(station.slug)}
              onBlur={() => onHover(null)}
              className="group flex w-[240px] shrink-0 flex-col items-start gap-2 text-left md:w-[280px] md:gap-4"
            >
              {/* Typography matches the existing city grid exactly, so the strip reads
                  as the same product rather than a second style. */}
              <h3
                className={`text-[20px] font-semibold leading-[130%] tracking-[-0.02em] transition-colors md:text-[28px] md:font-bold md:leading-[110%] ${
                  isActive ? "text-dark" : "text-dark/75 group-hover:text-dark"
                }`}
              >
                {station.city}
              </h3>
              <div className="flex flex-col gap-y-2 text-[16px] leading-[120%] text-dark md:text-[20px]">
                <span>{station.chargerCount} Ultra Fast Chargers</span>
                <span>{station.county} County</span>
                <span>
                  {station.distance !== null
                    ? `${formatDistance(station.distance, "mi")} away`
                    : statusLabel(station)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* The rule runs the full width; the accent segment slides along it. */}
      <div className="relative h-px w-full bg-black/10">
        <span
          ref={barRef}
          aria-hidden="true"
          className="absolute left-0 top-0 h-px bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}
