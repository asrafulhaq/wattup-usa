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
 * Basemap layers to hide.
 *
 * The reference frame is defined by what has been taken out: no roads, no places of
 * interest, no transit, and none of the basemap's own labels, since we draw our own.
 * Doing this in code rather than in a Mapbox Studio style keeps the design in the repo,
 * reviewable in a diff, instead of in a web editor where a change ships silently.
 */
const HIDDEN_LAYER_PATTERN =
  /road|bridge|tunnel|poi|transit|aeroway|building|ferry|path|golf|pitch/i;

/** Boundary lines are restyled rather than hidden, so counties stay distinguishable. */
const BOUNDARY_LAYER_PATTERN = /admin|boundary/i;

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
const BOUNDARY_COLOR = "#5E636A";
/** Brighter than the brand blue, which goes muddy on a dark ground. */
const ACCENT = "#3B8CFF";
const MUTED_DOT = "#8B919A";
const LABEL_LEAD = "#FFFFFF";
const LABEL_MUTED = "#9AA1AA";
const LABEL_HALO = "#2F343A";

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
  const [view, setView] = useState<MapView>(DEFAULT_MAP_VIEW);
  const option = viewOption(view);

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

    for (const layer of map.getStyle()?.layers ?? []) {
      // Our own layers are symbol layers too, and hiding them here is what made the
      // station labels disappear the first time. Skip anything we added.
      if (layer.id.startsWith("wattup-")) continue;
      try {
        if (layer.type === "symbol" || HIDDEN_LAYER_PATTERN.test(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        } else if (layer.id === "background" || layer.id === "land") {
          map.setPaintProperty(layer.id, "background-color", LAND_COLOR);
        } else if (/water|ocean/i.test(layer.id) && layer.type === "fill") {
          map.setPaintProperty(layer.id, "fill-color", WATER_COLOR);
        } else if (BOUNDARY_LAYER_PATTERN.test(layer.id) && layer.type === "line") {
          map.setPaintProperty(layer.id, "line-color", BOUNDARY_COLOR);
          map.setPaintProperty(layer.id, "line-width", 1.2);
          map.setPaintProperty(layer.id, "line-opacity", 1);
        }
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
      "circle-radius": [
        "case",
        ["==", ["get", "slug"], selectedSlug ?? ""],
        30,
        ["==", ["get", "slug"], hoveredSlug ?? ""],
        24,
        ["==", ["get", "lead"], 1],
        16,
        11,
      ],
      "circle-color": ["case", ["==", ["get", "lead"], 1], ACCENT, MUTED_DOT],
      "circle-blur": 1,
      "circle-opacity": [
        "case",
        ["==", ["get", "slug"], selectedSlug ?? ""],
        0.75,
        ["==", ["get", "slug"], hoveredSlug ?? ""],
        0.6,
        ["==", ["get", "lead"], 1],
        0.42,
        0.28,
      ],
    },
  };

  const dots: LayerProps = {
    id: DOTS_LAYER,
    type: "circle",
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "slug"], selectedSlug ?? ""],
        9,
        ["==", ["get", "slug"], hoveredSlug ?? ""],
        8,
        ["==", ["get", "lead"], 1],
        6,
        5,
      ],
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
    <div className={`relative ${className ?? ""}`}>
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
      interactiveLayerIds={[DOTS_LAYER]}
      cursor="default"
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
        <Layer {...labels} />
      </Source>
    </Map>
    </div>
  );
}
