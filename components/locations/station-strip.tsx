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

/** How long the strip takes to bring a station to the middle. */
const SCROLL_MS = 620;

/** Per frame velocity decay after a drag is released, and the point it stops. */
const FRICTION = 0.94;
const MIN_VELOCITY = 0.05;

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
  const animation = useRef(0);
  const [edges, setEdges] = useState({ start: false, end: false });

  /**
   * Scrolls the strip with an eased curve of our own.
   *
   * `scrollTo({behavior: "smooth"})` is left to the browser, which paces it differently
   * across engines and, in Chrome, arrives in visible steps over a distance this long.
   * Driving it frame by frame keeps the motion identical everywhere and matches the
   * easing the markers already use.
   */
  const glideTo = useCallback((target: number) => {
    const list = listRef.current;
    if (!list) return;
    cancelAnimationFrame(animation.current);

    const from = list.scrollLeft;
    const distance = target - from;
    if (Math.abs(distance) < 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      list.scrollLeft = target;
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / SCROLL_MS);
      list.scrollLeft = from + distance * easeInOut(t);
      if (t < 1) animation.current = requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const activeSlug = selectedSlug ?? stations[0]?.slug ?? null;

  /**
   * Which ends have more content past them, so only those are faded.
   *
   * The state is only replaced when one of the two booleans actually flips. Setting a
   * fresh object on every scroll event meant a smooth scroll re-rendered the strip on
   * every frame it moved, which is forty renders for one glide, on top of the map's own
   * animation loops.
   */
  const readEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    const next = { start: list.scrollLeft > 1, end: list.scrollLeft < max - 1 };
    setEdges((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
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
  /** Puts the indicator under the active entry. Never scrolls. */
  const positionBar = useCallback(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar || !activeSlug) return;
    const tab = list.querySelector<HTMLElement>(
      `[data-slug="${CSS.escape(activeSlug)}"]`,
    );
    if (!tab) return;
    bar.style.width = `${tab.offsetWidth}px`;
    bar.style.transform = `translateX(${tab.offsetLeft}px)`;
  }, [activeSlug]);

  /**
   * Keeps the indicator under the active entry through layout changes.
   *
   * Deliberately separate from the scroll below. Both used to live in one handler that a
   * ResizeObserver called, so any resize re-centred the strip: after dragging it by hand
   * it would glide back to the active station on its own, which is what made the
   * scrolling feel like it was fighting the pointer.
   */
  useLayoutEffect(() => {
    positionBar();
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(positionBar);
    observer.observe(list);
    return () => observer.disconnect();
  }, [positionBar, stations]);

  /** Brings the active entry to the middle, once, when the selection changes. */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !activeSlug) return;
    const tab = list.querySelector<HTMLElement>(
      `[data-slug="${CSS.escape(activeSlug)}"]`,
    );
    if (!tab) return;
    // Scrolled by hand rather than with scrollIntoView, which would also scroll the page
    // vertically to reach the strip.
    const target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    const max = list.scrollWidth - list.clientWidth;
    glideTo(Math.max(0, Math.min(max, target)));
  }, [activeSlug, glideTo]);

  /**
   * Drag to scroll.
   *
   * A drag that crosses the threshold suppresses the click it would otherwise end in,
   * so pulling the strip sideways never selects whichever entry it happened to finish
   * over.
   */
  const drag = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    lastX: 0,
    lastAt: 0,
    velocity: 0,
  });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || event.pointerType === "touch") return; // touch scrolls natively
    cancelAnimationFrame(animation.current); // a new grab overrides any glide in flight
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: list.scrollLeft,
      moved: false,
      lastX: event.clientX,
      lastAt: performance.now(),
      velocity: 0,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || !drag.current.active) return;

    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true;
    if (!drag.current.moved) return;

    list.scrollLeft = drag.current.startScroll - dx;

    // Velocity in pixels per millisecond, smoothed so one erratic sample cannot throw
    // the release. This is what the glide after letting go is built from.
    const now = performance.now();
    const elapsed = now - drag.current.lastAt;
    if (elapsed > 0) {
      const instant = (event.clientX - drag.current.lastX) / elapsed;
      drag.current.velocity = drag.current.velocity * 0.7 + instant * 0.3;
      drag.current.lastX = event.clientX;
      drag.current.lastAt = now;
    }
  };

  /**
   * Carries the strip on after the pointer lets go.
   *
   * Without this the strip stops dead the instant the button is released, which feels
   * like the content is stuck to the cursor rather than being thrown.
   */
  const endDrag = () => {
    const list = listRef.current;
    if (!list || !drag.current.active) return;
    drag.current.active = false;

    let velocity = drag.current.velocity;
    if (Math.abs(velocity) < MIN_VELOCITY) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let last = performance.now();
    const decay = (now: number) => {
      const frames = Math.max(1, (now - last) / 16.67);
      last = now;
      list.scrollLeft -= velocity * 16.67 * frames;
      velocity *= Math.pow(FRICTION, frames);
      if (Math.abs(velocity) > MIN_VELOCITY) {
        animation.current = requestAnimationFrame(decay);
      }
    };
    animation.current = requestAnimationFrame(decay);
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
                  className="group flex w-[260px] shrink-0 flex-col items-start gap-2 text-left md:w-[300px] md:gap-4"
                >
                  {/* Typography matches the existing city grid exactly, so the strip
                      reads as the same product rather than a second style. */}
                  <h3
                    className={`whitespace-nowrap text-[20px] font-semibold leading-[130%] tracking-[-0.02em] transition-colors md:text-[28px] md:font-bold md:leading-[110%] ${
                      isActive ? "text-dark" : "text-dark/75 group-hover:text-dark"
                    }`}
                  >
                    {station.city}
                  </h3>
                  {/* Three single lines, as the existing city grid has: power, place,
                      status. Each is nowrap, so an entry cannot grow to two lines and
                      throw the row out of alignment with its neighbours. Charger count
                      lives on the card and in the results list, where "6 chargers · San
                      Bernardino County" has the width to sit on one line. */}
                  <div className="flex flex-col gap-y-2 text-[16px] leading-[120%] text-dark md:text-[20px]">
                    <span className="whitespace-nowrap">
                      {station.maxPowerKw}kW Ultra Fast Charging
                    </span>
                    <span className="whitespace-nowrap">{station.county} County</span>
                    <span className="whitespace-nowrap">
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
