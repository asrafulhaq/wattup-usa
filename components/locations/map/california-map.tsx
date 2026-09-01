"use client";

import { CA_COUNTIES } from "@/lib/locations/ca-geometry";
import { project, type Point } from "@/lib/locations/projection";
import { orderByProximity, smoothPath, type Coord } from "@/lib/locations/smooth-line";
import type { PublicStation } from "@/lib/locations/types";
import { useMemo, useState } from "react";

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
 * The frame is widened to this aspect so the map fills a wide container.
 *
 * Fitting all 27 sites gives a portrait frame, because Roseville and Lodi sit roughly
 * 300 miles north of the other 25. A portrait frame in a landscape box can only ever be
 * a narrow sliver of California floating in empty space, however tall the box is: that
 * is geometry, not styling. So the default frame covers the dense cluster and is padded
 * out to landscape, and the outliers are reached from the strip or the "show all"
 * control.
 */
const TARGET_ASPECT = 1.75;

/** Sites outside this percentile band are treated as outliers when framing. */
const TRIM = 0.08;

function percentileBounds(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const lo = sorted[Math.floor((sorted.length - 1) * TRIM)];
  const hi = sorted[Math.ceil((sorted.length - 1) * (1 - TRIM))];
  return [lo, hi];
}

/**
 * Sizes as fractions of the frame width, not fixed viewBox units.
 *
 * The frame changes with the filtered results, and the SVG scales whatever it contains
 * to fill the container. A fixed radius therefore grows on screen every time the frame
 * tightens. Expressing sizes relative to the frame keeps a dot the same number of
 * pixels whether the map shows all of California or one county.
 */
const DOT_LEAD = 0.0042;
const DOT_MUTED = 0.0032;
const LABEL_SIZE = 0.0105;
const LABEL_OFFSET = 0.016;
const GLOW_RADIUS = 0.019;
const STROKE_LAND = 0.0019;
const CORRIDOR_WIDTH = 0.0012;

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
function placeLabels(placed: Placed[], scale: number, unit: number): Set<string> {
  const size = (LABEL_SIZE * unit) / scale;
  const offset = (LABEL_OFFSET * unit) / scale;
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
  const [fitAll, setFitAll] = useState(false);
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
    const [loX, hiX] = fitAll ? [Math.min(...xs), Math.max(...xs)] : percentileBounds(xs);
    const [loY, hiY] = fitAll ? [Math.min(...ys), Math.max(...ys)] : percentileBounds(ys);

    const padX = Math.max((hiX - loX) * FRAME_PADDING, 40);
    const padY = Math.max((hiY - loY) * FRAME_PADDING, 40);
    let x = loX - padX;
    let y = loY - padY;
    let width = hiX - loX + padX * 2;
    let height = hiY - loY + padY * 2;

    // Grow the short side so the frame matches the container's shape and the land fills
    // it, rather than sitting as a sliver with empty field either side.
    if (width / height < TARGET_ASPECT) {
      const wanted = height * TARGET_ASPECT;
      x -= (wanted - width) / 2;
      width = wanted;
    } else {
      const wanted = width / TARGET_ASPECT;
      y -= (wanted - height) / 2;
      height = wanted;
    }

    // Rounded for the same reason the projection is: identical strings on both sides.
    const round = (value: number) => Math.round(value * 1e3) / 1e3;
    return { x: round(x), y: round(y), width: round(width), height: round(height) };
  }, [placed, fitAll]);

  /** Sites the default frame leaves out, so the map can offer to include them. */
  const offFrame = useMemo(
    () =>
      placed.filter(
        ({ point }) =>
          point.x < frame.x ||
          point.x > frame.x + frame.width ||
          point.y < frame.y ||
          point.y > frame.y + frame.height,
      ),
    [placed, frame],
  );

  /**
   * The dashed connector, west to east across the lead sites.
   *
   * Purely a graphic device carried over from the reference, where it traces a driving
   * route. WattUp has no route: this is a corridor line, not a road, and it should come
   * out if it ever reads as one.
   */
  const corridor = useMemo(() => {
    const leads = orderByProximity(
      placed.filter((p) => p.isLead),
      ({ point }) => [point.x, point.y] as Coord,
    );
    if (leads.length < 2) return null;
    // A spline rather than straight segments, so the line leaves each site in a curve
    // instead of hinging at it.
    return smoothPath(leads.map(({ point }) => [point.x, point.y] as Coord));
  }, [placed]);

  const selected = placed.find((p) => p.station.slug === selectedSlug) ?? null;
  const scale = selected ? SELECTED_ZOOM : 1;
  // Every drawn size is a fraction of this, so the map looks the same at any framing.
  const unit = frame.width;
  const labelled = useMemo(() => placeLabels(placed, scale, unit), [placed, scale, unit]);

  const transform = selected
    ? `translate(${frame.x + frame.width / 2 - selected.point.x * scale} ${
        frame.y + frame.height / 2 - selected.point.y * scale
      }) scale(${scale})`
    : undefined;

  return (
    <div className={`relative ${className ?? ""}`}>
      {offFrame.length > 0 && (
        <button
          type="button"
          onClick={() => setFitAll(true)}
          className="absolute right-4 top-4 z-10 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-[13px] font-semibold text-dark/70 shadow-sm backdrop-blur transition-colors hover:text-dark"
        >
          {offFrame.length} more further north
        </button>
      )}
      {fitAll && (
        <button
          type="button"
          onClick={() => setFitAll(false)}
          className="absolute right-4 top-4 z-10 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-[13px] font-semibold text-dark/70 shadow-sm backdrop-blur transition-colors hover:text-dark"
        >
          Back to Southern California
        </button>
      )}
      <svg
      viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label={`Map of California showing ${stations.length} WattUp charging locations`}
      onClick={() => onSelect(null)}
    >
      <defs>
        {/* The halo on the line is a blurred copy of it drawn underneath, which is the
            SVG equivalent of the blurred stroke the WebGL map uses. */}
        <filter id="wattup-line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={(0.004 * frame.width) / scale} />
        </filter>
        <radialGradient id="wattup-marker-glow">
          <stop offset="0%" stopColor="#3B8CFF" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#3B8CFF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#3B8CFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g
        className="[transition:transform_700ms_cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        transform={transform}
        style={{ transformOrigin: "0 0" }}
      >
        {/* Land.
            The reference reads as scattered blobs because it draws only some counties;
            the field shows between them. California's counties tile continuously, so
            the same effect comes from pulling the empty ones back almost to the ground
            colour and leaving the seven that hold sites clearly forward. The state
            silhouette stays faintly readable, which a hard cut would lose. */}
        {CA_COUNTIES.map((county) => (
          <path
            key={county.fips}
            d={county.d}
            fill={occupied.has(county.fips) ? "#53585E" : "#464B52"}
            stroke="#3A3F45"
            strokeWidth={(STROKE_LAND * unit) / scale}
            strokeLinejoin="round"
          />
        ))}

        {corridor && (
          <>
            <path
              d={corridor}
              fill="none"
              stroke="#3B8CFF"
              strokeOpacity={0.45}
              strokeWidth={(CORRIDOR_WIDTH * 7 * unit) / scale}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#wattup-line-glow)"
            />
            <path
              d={corridor}
              fill="none"
              stroke="#3B8CFF"
              strokeOpacity={0.95}
              strokeWidth={(CORRIDOR_WIDTH * 1.6 * unit) / scale}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {placed.map(({ station, point, isLead }) => {
          const isSelected = station.slug === selectedSlug;
          const isHovered = station.slug === hoveredSlug;
          const active = isSelected || isHovered;
          const r = ((isLead ? DOT_LEAD : DOT_MUTED) * unit) / scale;
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
              <circle
                cx={point.x}
                cy={point.y}
                r={
                  ((active ? GLOW_RADIUS : GLOW_RADIUS * (isLead ? 0.6 : 0.45)) * unit) /
                  scale
                }
                fill="url(#wattup-marker-glow)"
                opacity={active ? 1 : isLead ? 0.7 : 0.45}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                fill={isLead || active ? "#3B8CFF" : "#8B919A"}
              />
              {showLabel && (
                <text
                  x={point.x}
                  y={point.y + (LABEL_OFFSET * unit) / scale}
                  textAnchor="middle"
                  fontSize={(LABEL_SIZE * unit) / scale}
                  fontWeight={isLead || active ? 700 : 500}
                  fill={active ? "#FFFFFF" : isLead ? "#FFFFFF" : "#9AA1AA"}
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
    </div>
  );
}
