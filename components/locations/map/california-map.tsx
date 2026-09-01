"use client";

import { CA_COUNTIES } from "@/lib/locations/ca-geometry";
import { project, type Point } from "@/lib/locations/projection";
import type { PublicStation } from "@/lib/locations/types";
import { useMemo } from "react";

interface CaliforniaMapProps {
  stations: PublicStation[];
  selectedSlug: string | null;
  hoveredSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  className?: string;
}

/** How far in the map moves when a station is selected. */
const SELECTED_ZOOM = 3.4;

/** Breathing room around the sites, as a fraction of their bounding box. */
const FRAME_PADDING = 0.22;

/**
 * Sizes in viewBox units, tuned so the map reads at the reference's proportions.
 * Everything drawn is divided by the current zoom so it holds its size on screen.
 */
const DOT_LEAD = 6.5;
const DOT_MUTED = 5;
const LABEL_SIZE = 21;
const LABEL_OFFSET = 27;
const GLOW_RADIUS = 30;

interface Placed {
  station: PublicStation;
  point: Point;
  /** Sites with switchgear ordered lead the design; the rest sit back. */
  isLead: boolean;
}

/**
 * Greedy label placement.
 *
 * The reference gets its calm from labelling only some points. Twenty five of our sites
 * sit inside greater Los Angeles and San Diego, so labelling all of them would produce a
 * wall of overlapping text. Leads are offered a label first, and any label whose box
 * would collide with one already placed is dropped rather than drawn on top.
 */
function placeLabels(placed: Placed[], scale: number): Set<string> {
  const size = LABEL_SIZE / scale;
  const offset = LABEL_OFFSET / scale;
  const taken: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const shown = new Set<string>();

  const candidates = [...placed].sort((a, b) => {
    if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;
    return b.station.chargerCount - a.station.chargerCount;
  });

  for (const { station, point } of candidates) {
    // Approximating glyph width avoids a DOM measure pass on every zoom change.
    const width = station.city.length * size * 0.54;
    const box = {
      x1: point.x - width / 2,
      y1: point.y + offset - size,
      x2: point.x + width / 2,
      y2: point.y + offset + size * 0.3,
    };
    const collides = taken.some(
      (t) => box.x1 < t.x2 && box.x2 > t.x1 && box.y1 < t.y2 && box.y2 > t.y1,
    );
    if (collides) continue;
    taken.push(box);
    shown.add(station.slug);
  }
  return shown;
}

/**
 * The California basemap, drawn as inline SVG.
 *
 * The reference frame is an illustration rather than a slippy map: separated land
 * shapes on an empty field, no roads, no place labels of its own, small dot markers and
 * a single accent colour. That means it does not need a map library. All 58 counties
 * are about 6 KB gzipped against roughly 230 KB for a WebGL renderer before it fetches
 * a single tile, there is no GPU context to lose, and the map draws with no network
 * request at all. On a low end phone that is the difference between interactive and not.
 *
 * Zoom is a CSS transition on a transform, so the browser composites it rather than
 * running an animation loop in JavaScript.
 */
export function CaliforniaMap({
  stations,
  selectedSlug,
  hoveredSlug,
  onSelect,
  onHover,
  className,
}: CaliforniaMapProps) {
  const placed: Placed[] = useMemo(
    () =>
      stations.map((station) => ({
        station,
        point: project(station.latitude, station.longitude),
        isLead: station.goLiveYear === 2026,
      })),
    [stations],
  );

  const occupied = useMemo(
    () => new Set(stations.map((s) => s.countyFips)),
    [stations],
  );

  // California is a portrait shape and the sites stretch it further: Roseville and Lodi
  // sit far north of the other 25. Sizing the element from the frame's own aspect ratio
  // means the map is never cropped and never letterboxed.
  const frame = useMemo(() => {
    const xs = placed.map((p) => p.point.x);
    const ys = placed.map((p) => p.point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padX = Math.max((maxX - minX) * FRAME_PADDING, 40);
    const padY = Math.max((maxY - minY) * FRAME_PADDING, 40);
    return {
      x: minX - padX,
      y: minY - padY,
      width: maxX - minX + padX * 2,
      height: maxY - minY + padY * 2,
    };
  }, [placed]);

  /**
   * The dashed connector, west to east across the lead sites.
   *
   * Purely a graphic device carried over from the reference, where it traces a driving
   * route. WattUp has no route: this is a corridor line, not a road, and it should come
   * out if it ever reads as one.
   */
  const corridor = useMemo(() => {
    const leads = placed.filter((p) => p.isLead).sort((a, b) => a.point.x - b.point.x);
    if (leads.length < 2) return null;
    return leads.map((p, i) => `${i === 0 ? "M" : "L"}${p.point.x} ${p.point.y}`).join(" ");
  }, [placed]);

  const selected = placed.find((p) => p.station.slug === selectedSlug) ?? null;
  const scale = selected ? SELECTED_ZOOM : 1;
  const labelled = useMemo(() => placeLabels(placed, scale), [placed, scale]);

  const transform = selected
    ? `translate(${frame.x + frame.width / 2 - selected.point.x * scale} ${
        frame.y + frame.height / 2 - selected.point.y * scale
      }) scale(${scale})`
    : undefined;

  return (
    <svg
      viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      className={className}
      role="img"
      aria-label={`Map of California showing ${stations.length} WattUp charging locations`}
      onClick={() => onSelect(null)}
    >
      <defs>
        <radialGradient id="wattup-marker-glow">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.42" />
          <stop offset="55%" stopColor="var(--color-primary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g
        className="[transition:transform_700ms_cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        transform={transform}
        style={{ transformOrigin: "0 0" }}
      >
        {/* Land. The stroke is the page ground, which is what separates the shapes into
            discrete blobs instead of one continuous mass. */}
        {CA_COUNTIES.map((county) => (
          <path
            key={county.fips}
            d={county.d}
            fill={occupied.has(county.fips) ? "#D3DCE8" : "#DFE5EE"}
            stroke="#F1F4F9"
            strokeWidth={2.6 / scale}
            strokeLinejoin="round"
          />
        ))}

        {corridor && (
          <path
            d={corridor}
            fill="none"
            stroke="#AFBBCB"
            strokeWidth={1.7 / scale}
            strokeDasharray={`${7 / scale} ${7 / scale}`}
            strokeLinecap="round"
          />
        )}

        {placed.map(({ station, point, isLead }) => {
          const isSelected = station.slug === selectedSlug;
          const isHovered = station.slug === hoveredSlug;
          const active = isSelected || isHovered;
          const r = (isLead ? DOT_LEAD : DOT_MUTED) / scale;
          const showLabel = labelled.has(station.slug) || active;

          return (
            <g
              key={station.slug}
              role="button"
              tabIndex={0}
              aria-label={`${station.name}, ${station.city}. ${station.chargerCount} chargers. Coming ${station.goLiveYear}.`}
              aria-pressed={isSelected}
              className="cursor-pointer outline-none"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(isSelected ? null : station.slug);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onSelect(isSelected ? null : station.slug);
              }}
              onMouseEnter={() => onHover(station.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(station.slug)}
              onBlur={() => onHover(null)}
            >
              {active && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={GLOW_RADIUS / scale}
                  fill="url(#wattup-marker-glow)"
                />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                fill={isLead || active ? "var(--color-primary)" : "#98A5B7"}
              />
              {showLabel && (
                <text
                  x={point.x}
                  y={point.y + LABEL_OFFSET / scale}
                  textAnchor="middle"
                  fontSize={LABEL_SIZE / scale}
                  fontWeight={isLead || active ? 700 : 500}
                  fill={active ? "#0F1926" : isLead ? "#26313F" : "#7C8899"}
                  className="pointer-events-none select-none"
                >
                  {station.city}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
