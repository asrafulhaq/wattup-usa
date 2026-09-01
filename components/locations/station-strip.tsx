"use client";

import { formatDistance } from "@/lib/locations/distance";
import { statusLabel } from "@/lib/locations/public";
import type { RankedStation } from "@/lib/locations/types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface StationStripProps {
  stations: RankedStation[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
}

/** Movement past this many pixels counts as a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Width of the fade at each end, in pixels. */
const FADE = 56;

/**
 * The horizontal strip of locations above the map, with the accent bar that slides
 * between them.
 *
 * The reference lays each entry out as a name, a quiet region line, then two data lines.
 * Ours reads city, state, charger count, opening. Selecting one re-centres the map.
 */
export function StationStrip({
  stations,
  selectedSlug,
  onSelect,
  onHover,
}: StationStripProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const activeSlug = selectedSlug ?? stations[0]?.slug ?? null;

  /** Which ends have more content past them, so only those are faded. */
  const readEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setEdges({ start: list.scrollLeft > 1, end: list.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    readEdges();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(readEdges);
    observer.observe(list);
    return () => observer.disconnect();
  }, [readEdges, stations]);

  /**
   * Moves the indicator, and brings the active entry into view.
   *
   * The indicator is written straight to the element's style rather than held in state:
   * a measurement is not application state, and keeping it out of the render loop avoids
   * a second pass on every resize. It lives inside the scrolling content, so its offset
   * and the entry's offset are in the same coordinate space and stay aligned however far
   * the strip is scrolled.
   */
  useLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar || !activeSlug) return;

    const move = () => {
      const tab = list.querySelector<HTMLElement>(
        `[data-slug="${CSS.escape(activeSlug)}"]`,
      );
      if (!tab) return;
      bar.style.width = `${tab.offsetWidth}px`;
      bar.style.transform = `translateX(${tab.offsetLeft}px)`;

      // Scrolled by hand rather than with scrollIntoView, which would also scroll the
      // page vertically to reach the strip.
      const target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
      const max = list.scrollWidth - list.clientWidth;
      list.scrollTo({
        left: Math.max(0, Math.min(max, target)),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };

    move();
    const observer = new ResizeObserver(move);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeSlug, stations]);

  /**
   * Drag to scroll.
   *
   * A drag that crosses the threshold suppresses the click it would otherwise end in,
   * so pulling the strip sideways never selects whichever entry it happened to finish
   * over.
   */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || event.pointerType === "touch") return; // touch scrolls natively
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: list.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || !drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true;
    if (drag.current.moved) list.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  if (stations.length === 0) return null;

  const mask =
    edges.start && edges.end
      ? `linear-gradient(to right, transparent 0, black ${FADE}px, black calc(100% - ${FADE}px), transparent 100%)`
      : edges.start
        ? `linear-gradient(to right, transparent 0, black ${FADE}px, black 100%)`
        : edges.end
          ? `linear-gradient(to right, black 0, black calc(100% - ${FADE}px), transparent 100%)`
          : undefined;

  return (
    <div className="w-full">
      <div
        ref={listRef}
        onScroll={readEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(event) => {
          if (!drag.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }}
        // The fade is a mask rather than an overlay so it works over any background, and
        // it appears only at the ends that actually have more content past them.
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="w-full cursor-grab overflow-x-auto pb-8 select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="inline-flex min-w-full flex-col">
          <div
            role="tablist"
            aria-label="Charging locations"
            className="flex gap-5 md:gap-8"
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
                  {/* Typography matches the existing city grid exactly, so the strip
                      reads as the same product rather than a second style. */}
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

          {/* The rule sits inside the scrolling content, so it cannot run past the
              container and the indicator shares its coordinate space. */}
          <div className="relative mt-6 h-px w-full bg-black/10">
            <span
              ref={barRef}
              aria-hidden="true"
              className="absolute left-0 top-0 h-px bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
