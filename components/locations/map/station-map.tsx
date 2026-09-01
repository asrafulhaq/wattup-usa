"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  DEFAULT_MAP_VIEW,
  MAP_VIEWS,
  viewOption,
  type MapView,
} from "@/lib/locations/map-views";
import { statusLabel } from "@/lib/locations/public";
import { orderByProximity, smoothLine, type Coord } from "@/lib/locations/smooth-line";
import type { PublicStation } from "@/lib/locations/types";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  AttributionControl,
  Layer,
  Source,
  type LayerProps,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl/mapbox";

interface StationMapProps {
  stations: PublicStation[];
  selectedSlug: string | null;
  hoveredSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  mapboxToken: string;
  className?: string;
}

const DOTS_LAYER = "wattup-dots";
const LABELS_LAYER = "wattup-labels";
const PULSE_LAYER = "wattup-corridor-pulse";
const ACTIVE_GLOW_LAYER = "wattup-active-glow";
const ACTIVE_DOT_LAYER = "wattup-active-dot";

/** How long the active marker takes to grow in or fall away. */
const ACTIVE_TWEEN_MS = 320;

/** The halo's opacity, held steady so it never fades while a station is active. */
const ACTIVE_GLOW_OPACITY = 0.6;

/** Radii the active marker moves between, in pixels. */
const ACTIVE_GLOW_FROM = 18;
const ACTIVE_GLOW_TO = 52;
const ACTIVE_DOT_FROM = 5.5;
const ACTIVE_DOT_TO = 9.5;

/** Eased at both ends, so growing in and falling away are equally soft. */
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How long the highlight takes to travel the line once. */
const PULSE_DURATION_MS = 5200;

/** Half width of the highlight, as a fraction of the line. */
const PULSE_HALF_WIDTH = 0.07;

/**
 * A gradient with one bright band at `head`, transparent elsewhere.
 *
 * `line-gradient` stops must be strictly increasing and inside 0..1, so the band is
 * clamped at both ends rather than allowed to wrap; it fades out at the finish and back
 * in at the start, which reads as continuous travel without a seam.
 */
function pulseGradient(head: number) {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const start = clamp(head - PULSE_HALF_WIDTH);
  const end = clamp(head + PULSE_HALF_WIDTH);
  const stops: [number, string][] = [
    [0, "rgba(59,140,255,0)"],
    [start, "rgba(59,140,255,0)"],
    [clamp(head), "rgba(160,205,255,0.9)"],
    [end, "rgba(59,140,255,0)"],
    [1, "rgba(59,140,255,0)"],
  ];

  // Collapse any stops that clamping pushed onto the same position, since a repeated
  // input makes the whole expression invalid.
  const unique: [number, string][] = [];
  for (const [at, color] of stops) {
    if (unique.length > 0 && at <= unique[unique.length - 1][0]) continue;
    unique.push([at, color]);
  }

  return [
    "interpolate",
    ["linear"],
    ["line-progress"],
    ...unique.flat(),
  ] as unknown as never;
}

/**
 * Palette, taken directly off `_.jpeg`.
 *
 * Its field measures luminance 64 with land at 90, so land sits 41% above its ground.
 * The values below land at 62 and 87, which is +40%.
 *
 * The map is dark while the page around it stays light. A light ground cannot carry this
 * contrast: reproducing the same 26 point gap on near white gives 13%, which is what made
 * earlier passes read as flat grey. The drama is the dark field, not the choice of greys.
 *
 * The reference is 98.4% neutral grey and 1.6% saturated accent, so its colour comes from
 * contrast plus a single vivid hue rather than from many hues. Every grey there is cool,
 * blue running about 11 above red, which is kept.
 *
 * It draws no outline on its shapes at all; separation is tonal. The boundary colour here
 * is barely above the land, present only so counties do not fuse into one silhouette.
 */
const LAND_COLOR = "#53585E";
const WATER_COLOR = "#3A3F45";
/** Brighter than the brand blue, which goes muddy on a dark ground. */
const ACCENT = "#3B8CFF";
const MUTED_DOT = "#8B919A";
const LABEL_LEAD = "#FFFFFF";
const LABEL_MUTED = "#9AA1AA";
const LABEL_HALO = "#2F343A";
/** Roads sit just above the land, present but never competing with the markers. */
const ROAD_COLOR = "#6A6F77";
const PLACE_LABEL_COLOR = "#A7AEB8";

/**
 * Layer groups for the minimal view.
 *
 * Only the noise is hidden. Landuse, landcover, parks and hillshade carry a dozen
 * slightly different shades and, with nothing else on the map, read as blotches rather
 * than as regions. Roads and place names stay: they are what makes the map answer a
 * question rather than just look like one.
 */
const NOISE_LAYERS =
  /landuse|landcover|national[-_]?park|hillshade|pitch|golf|building|aeroway|ferry|crosswalk|structure/i;
const ROAD_LAYERS = /road|street|bridge|tunnel|motorway|trunk|primary|secondary/i;
const POI_LABELS = /poi|transit|airport|shield|road[-_]?(label|number|exit)/i;
const PLACE_LABELS =
  /settlement|state[-_]?label|country[-_]?label|continent|place[-_]?label|marine[-_]?label|natural[-_]?label/i;

export function StationMap({
  stations,
  selectedSlug,
  hoveredSlug,
  onSelect,
  onHover,
  mapboxToken,
  className,
}: StationMapProps) {
  const mapRef = useRef<MapRef>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  /** Where the active marker's grow animation currently sits, 0 to 1. */
  const activeProgress = useRef(0);
  /** The station the last tween was for, so a change of marker restarts the growth. */
  const previousActive = useRef<string | null>(null);
  const [view, setView] = useState<MapView>(DEFAULT_MAP_VIEW);
  const option = viewOption(view);

  // Hover takes precedence over selection, so moving the pointer over any marker grows
  // it even while another station is open. Leaving the marker hands the emphasis back to
  // whatever is selected rather than dropping it entirely.
  const activeSlug = hoveredSlug ?? selectedSlug;

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: stations.map((station) => ({
        type: "Feature" as const,
        id: station.slug,
        properties: {
          slug: station.slug,
          city: station.city,
          lead: station.goLiveYear === 2026 ? 1 : 0,
          label: `${station.city}\n${station.chargerCount} chargers · ${statusLabel(station)}`,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [station.longitude, station.latitude],
        },
      })),
    }),
    [stations],
  );

  /**
   * The dashed connector, west to east across the sites opening first.
   *
   * Carried over from the reference, where it traces a driving route. WattUp has no
   * route between these sites, so this is a graphic device and nothing more.
   */
  const corridor = useMemo(() => {
    const leads = orderByProximity(
      stations.filter((station) => station.goLiveYear === 2026),
      (station) => [station.longitude, station.latitude] as Coord,
    );
    const curve = smoothLine(leads.map((s) => [s.longitude, s.latitude] as Coord));
    return {
      type: "FeatureCollection" as const,
      features:
        leads.length < 2
          ? []
          : [
              {
                type: "Feature" as const,
                properties: {},
                geometry: { type: "LineString" as const, coordinates: curve },
              },
            ],
    };
  }, [stations]);

  /**
   * The opening view.
   *
   * Fitting all 27 sites is fitting a tall, narrow box, because Roseville and Lodi sit
   * roughly 300 miles north of the other 25. Fitted into a wide container that box is
   * constrained by its height, and the map ends up showing Nevada and Arizona to fill
   * the width. Trimming the outermost sites gives the cluster where 25 of them actually
   * are; the two northern ones are still on the map, still in the strip, and selecting
   * either flies to it.
   */
  const bounds = useMemo<LngLatBoundsLike>(() => {
    const trim = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const at = (fraction: number) =>
        sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)))];
      return [at(0.08), at(0.92)] as const;
    };
    const [west, east] = trim(stations.map((s) => s.longitude));
    const [south, north] = trim(stations.map((s) => s.latitude));
    return [
      [west, south],
      [east, north],
    ];
  }, [stations]);

  /**
   * Strips the basemap for the minimal view.
   *
   * Detailed views are left exactly as Mapbox ships them, which is the point of them.
   */
  const applyStyle = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || option.detailed) return;

    // Keep land, water, boundaries, roads and place names. Hide the rest.
    //
    // The shapes come from the basemap rather than from geometry of our own. An earlier
    // pass drew California counties from a local file, which looked right and only
    // worked in California: pan anywhere else and the map was empty, and the Singapore
    // and Thailand rollout would have needed a new file each time. Styling the basemap
    // covers the whole world from one rule.
    for (const layer of map.getStyle()?.layers ?? []) {
      if (layer.id.startsWith("wattup-")) continue;
      const { id, type } = layer;

      try {
        if (type === "background") {
          // In a Mapbox style the background is the land; water is filled over it.
          map.setPaintProperty(id, "background-color", LAND_COLOR);
          continue;
        }

        if (NOISE_LAYERS.test(id) || POI_LABELS.test(id)) {
          map.setLayoutProperty(id, "visibility", "none");
          continue;
        }

        if (/water|ocean|bathymetry/i.test(id)) {
          map.setLayoutProperty(id, "visibility", "visible");
          map.setPaintProperty(
            id,
            type === "line" ? "line-color" : "fill-color",
            WATER_COLOR,
          );
          continue;
        }

        if (type === "line" && /admin|boundary/i.test(id)) {
          // Drawn in the field colour rather than as a border: a stroke the colour of
          // the ground cuts a gap between neighbouring regions, which is what leaves the
          // reference's separated shapes instead of one continuous landmass.
          map.setLayoutProperty(id, "visibility", "visible");
          map.setPaintProperty(id, "line-color", WATER_COLOR);
          map.setPaintProperty(id, "line-width", 1.6);
          map.setPaintProperty(id, "line-opacity", 0.9);
          map.setPaintProperty(id, "line-dasharray", [1, 0]);
          continue;
        }

        if (type === "line" && ROAD_LAYERS.test(id)) {
          map.setLayoutProperty(id, "visibility", "visible");
          map.setPaintProperty(id, "line-color", ROAD_COLOR);
          map.setPaintProperty(id, "line-opacity", 0.55);
          continue;
        }

        if (type === "symbol" && PLACE_LABELS.test(id)) {
          map.setLayoutProperty(id, "visibility", "visible");
          map.setPaintProperty(id, "text-color", PLACE_LABEL_COLOR);
          map.setPaintProperty(id, "text-halo-color", LABEL_HALO);
          map.setPaintProperty(id, "text-halo-width", 1.4);
          continue;
        }

        map.setLayoutProperty(id, "visibility", "none");
      } catch {
        // A style can rename or restructure layers between versions; a layer that does
        // not take a given property is not fatal.
      }
    }
  }, [option.detailed]);

  /**
   * Reapplies the strip every time a basemap finishes loading.
   *
   * Switching view changes the style prop, but Mapbox swaps the style asynchronously
   * afterwards. Acting on the prop change alone stripped the style that was on its way
   * out and then the incoming one replaced everything, which is why the minimal view
   * kept showing the basemap labels it was supposed to hide. `style.load` fires once the
   * new style is actually in place, which is the only safe moment to touch its layers.
   */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.on("style.load", applyStyle);
    // Covers the first mount, where the style can finish loading before this runs.
    if (map.isStyleLoaded()) applyStyle();

    return () => {
      map.off("style.load", applyStyle);
    };
  }, [applyStyle]);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    // resize first: the map can mount before its container has been laid out, and a fit
    // computed against the wrong size lands at the wrong zoom.
    map.resize();
    map.fitBounds(bounds, { padding: 56, duration: 0 });
    applyStyle();
  }, [bounds, applyStyle]);

  // Selecting from the strip or the list should move the map, not just recolour a dot.
  useEffect(() => {
    const station = stations.find((s) => s.slug === selectedSlug);
    if (!station) return;
    mapRef.current?.getMap().flyTo({
      center: [station.longitude, station.latitude],
      zoom: 10.5,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900,
    });
  }, [selectedSlug, stations]);

  /**
   * Reads the slug off a hit feature.
   *
   * mapbox-gl types a queried feature as GeoJSONFeature, which does not surface
   * `properties` on the type even though it is always there at runtime, so this narrows
   * through unknown and checks the one field we set ourselves.
   */
  const slugAt = (event: MapMouseEvent): string | null => {
    const feature = event.features?.[0] as unknown as
      | { properties?: Record<string, unknown> }
      | undefined;
    const slug = feature?.properties?.slug;
    return typeof slug === "string" ? slug : null;
  };

  /**
   * Drives the travelling highlight.
   *
   * The gradient is rewritten on a frame loop rather than animated by the style, because
   * Mapbox has no transition for `line-gradient`. It is capped at about 30fps: the
   * highlight is meant to be barely noticed, and repainting a line layer 60 times a
   * second costs battery for movement nobody is watching. It does not run at all when
   * the visitor has asked for reduced motion, or while the tab is in the background.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let lastPaint = 0;
    const started = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || now - lastPaint < 33) return;
      lastPaint = now;

      const map = mapRef.current?.getMap();
      if (!map?.getLayer(PULSE_LAYER)) return;
      const head = ((now - started) % PULSE_DURATION_MS) / PULSE_DURATION_MS;
      try {
        map.setPaintProperty(PULSE_LAYER, "line-gradient", pulseGradient(head));
      } catch {
        // The layer goes away for a moment while a new basemap style loads.
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  /**
   * Keeps the drawing buffer matched to the container.
   *
   * Mapbox sizes its canvas once and then only listens for window resizes. Anything that
   * changes the container without changing the window leaves the canvas at its old size
   * and the container's own background showing through: a responsive breakpoint, a
   * sibling collapsing, or simply editing the height during development.
   */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const observer = new ResizeObserver(() => mapRef.current?.getMap()?.resize());
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  /**
   * Grows the active marker.
   *
   * Mapbox will not transition a paint property whose value comes from a data
   * expression, and the base markers size themselves with `["case", ["get", ...]]`, so
   * the transitions this originally used never fired: the marker jumped in one frame no
   * matter what duration was set. The active station is therefore its own pair of
   * layers, filtered to one feature, whose radius is a plain number. A plain number can
   * be driven frame by frame, which is what actually produces the movement.
   */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const target = activeSlug ? 1 : 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Moving straight from one marker to another used to leave the progress at 1, so the
    // marker being moved to appeared already grown. Restarting from zero whenever the
    // active station changes means it grows in the same way it would from nothing, while
    // leaving a marker still falls away from wherever the previous tween had reached.
    const movedToAnother = activeSlug !== null && activeSlug !== previousActive.current;
    previousActive.current = activeSlug;
    const from = reduced ? target : movedToAnother ? 0 : activeProgress.current;
    const started = performance.now();
    let frame = 0;

    const paint = (value: number) => {
      activeProgress.current = value;
      const eased = easeInOut(value);
      if (!map.getLayer(ACTIVE_DOT_LAYER)) return;
      try {
        map.setPaintProperty(
          ACTIVE_GLOW_LAYER,
          "circle-radius",
          ACTIVE_GLOW_FROM + (ACTIVE_GLOW_TO - ACTIVE_GLOW_FROM) * eased,
        );
        map.setPaintProperty(
          ACTIVE_DOT_LAYER,
          "circle-radius",
          ACTIVE_DOT_FROM + (ACTIVE_DOT_TO - ACTIVE_DOT_FROM) * eased,
        );
      } catch {
        // The layers go away for a moment while a new basemap style loads.
      }
    };

    if (reduced || from === target) {
      paint(target);
      return;
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / ACTIVE_TWEEN_MS);
      paint(from + (target - from) * t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // option.style is a dependency because switching basemap recreates every layer at
    // the paint values declared in JSX, which are the start of the tween. Without this
    // the active marker silently reverts to its small size after a view change and stays
    // there until the selection happens to change.
  }, [activeSlug, option.style]);

  const onClick = useCallback(
    (event: MapMouseEvent) => onSelect(slugAt(event)),
    [onSelect],
  );

  /**
   * The halo under every marker.
   *
   * `circle-blur` fades the edge outward in the shader, so this costs one more circle
   * layer rather than an image or a DOM element per station. The selected marker gets a
   * wider, stronger halo, which is how the reference singles one out.
   */
  const glow: LayerProps = {
    id: "wattup-glow",
    type: "circle",
    paint: {
      "circle-radius": ["case", ["==", ["get", "lead"], 1], 15, 10],
      "circle-color": ["case", ["==", ["get", "lead"], 1], ACCENT, MUTED_DOT],
      "circle-blur": 0.85,
      "circle-opacity": ["case", ["==", ["get", "lead"], 1], 0.4, 0.26],
    },
  };

  const dots: LayerProps = {
    id: DOTS_LAYER,
    type: "circle",
    paint: {
      "circle-radius": ["case", ["==", ["get", "lead"], 1], 5.5, 4.5],
      "circle-color": ["case", ["==", ["get", "lead"], 1], ACCENT, MUTED_DOT],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": option.detailed ? "#FFFFFF" : WATER_COLOR,
      "circle-opacity": 1,
    },
  };

  const labels: LayerProps = {
    id: LABELS_LAYER,
    type: "symbol",
    layout: {
      "text-field": ["get", "city"],
      "text-size": 13,
      "text-offset": [0, 1.1],
      "text-anchor": "top",
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
      // Mapbox drops labels that would collide, which is the same restraint the
      // reference shows: 25 of our 27 sites sit inside two metros.
      "text-allow-overlap": false,
      "text-padding": 4,
    },
    paint: {
      // On imagery and street detail the labels need to hold over anything underneath,
      // so they invert: dark text on a light halo instead of the reverse.
      "text-color": option.detailed
        ? ["case", ["==", ["get", "lead"], 1], "#111A24", "#3D4756"]
        : ["case", ["==", ["get", "lead"], 1], LABEL_LEAD, LABEL_MUTED],
      "text-halo-color": option.detailed ? "#FFFFFF" : LABEL_HALO,
      "text-halo-width": option.detailed ? 2 : 1.6,
    },
  };

  return (
    <div ref={shellRef} className={`relative ${className ?? ""}`}>
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-black/5 backdrop-blur md:right-4 md:top-4">
        {MAP_VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setView(entry.id)}
            aria-pressed={entry.id === view}
            className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              entry.id === view
                ? "bg-primary text-white"
                : "text-dark/65 hover:bg-black/5 hover:text-dark"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      initialViewState={{ bounds, fitBoundsOptions: { padding: 64 } }}
      mapStyle={option.style}
      style={{ width: "100%", height: "100%" }}
      onLoad={onLoad}
      onClick={onClick}
      onMouseMove={(event) => onHover(slugAt(event))}
      onMouseLeave={() => onHover(null)}
      interactiveLayerIds={[DOTS_LAYER, ACTIVE_DOT_LAYER]}
      // A marker is clickable, so it should say so. Everything else keeps the grab
      // cursor the map itself provides for panning.
      cursor={hoveredSlug ? "pointer" : undefined}
      // Disabled here so the compact control below can replace it, not to remove the
      // credit: Mapbox's terms require attribution to stay visible.
      attributionControl={false}
      reuseMaps
    >
      {/* The reference lights its field from the top left and falls away to the bottom
          right. That belongs only to the minimal view: over imagery or street detail the
          same wash just dims the map. */}
      {!option.detailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(125%_125%_at_12%_8%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_42%,rgba(0,0,0,0.28)_100%)]"
        />
      )}

      {/* lineMetrics computes each vertex's distance along the line, which is what
          line-gradient reads. Without it the animated pulse below silently does nothing. */}
      {/* Mapbox's terms require the credit to stay visible. Compact renders it as a
          small "i" that expands on click, which keeps it out of the way without
          removing it. */}
      <AttributionControl compact position="bottom-right" />

      <Source id="wattup-corridor" type="geojson" data={corridor} lineMetrics>
        {/* Two passes make the glow: a wide, heavily blurred stroke underneath, then a
            crisp thin one on top. A single blurred line reads as smudged rather than lit,
            because there is no bright core for the halo to come off. */}
        <Layer
          id="wattup-corridor-glow"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ACCENT,
            "line-width": 12,
            "line-blur": 12,
            "line-opacity": 0.4,
          }}
        />
        <Layer
          id="wattup-corridor-line"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ACCENT,
            "line-width": 2.2,
            "line-opacity": 0.95,
          }}
        />
        {/* The travelling highlight. Its gradient is rewritten each frame by the effect
            below; the stops here are only the starting position. */}
        <Layer
          id={PULSE_LAYER}
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-width": 5,
            "line-blur": 4,
            "line-gradient": pulseGradient(0),
          }}
        />
      </Source>

      <Source id="wattup-stations" type="geojson" data={geojson}>
        <Layer {...glow} />
        <Layer {...dots} />

        {/* The active station, drawn again on top of itself. Filtered to one feature so
            its radius is a plain number the frame loop above can drive. */}
        <Layer
          id={ACTIVE_GLOW_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], activeSlug ?? "\u0000"]}
          paint={{
            "circle-color": ACCENT,
            "circle-blur": 0.9,
            "circle-radius": ACTIVE_GLOW_FROM,
            // Held constant rather than animated. Fading it in made the halo wash out at
            // exactly the moment the marker was meant to be emphasised; only the radius
            // moves, and the filter removes the layer outright when nothing is active.
            "circle-opacity": ACTIVE_GLOW_OPACITY,
          }}
        />
        <Layer
          id={ACTIVE_DOT_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], activeSlug ?? "\u0000"]}
          paint={{
            // Identical to the base markers, only larger. Giving the active one its own
            // treatment, whether an inverted fill or a missing stroke, made it read as a
            // different kind of thing rather than as the same marker singled out.
            "circle-color": ACCENT,
            "circle-radius": ACTIVE_DOT_FROM,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": option.detailed ? "#FFFFFF" : WATER_COLOR,
            "circle-opacity": 1,
          }}
        />
        <Layer {...labels} />
      </Source>
    </Map>
    </div>
  );
}
