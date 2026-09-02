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
import type {
  ExpressionSpecification,
  LngLatBoundsLike,
  Map as MapboxMap,
} from "mapbox-gl";
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
  /**
   * How close to fly when a station is selected.
   *
   * The finder wants the network zoom: near enough to read the selected site, far enough
   * that its neighbours and the corridor between them stay on screen. A station page
   * wants the opposite, because the page is already about one site and the map is the
   * only thing on it that can show where the forecourt actually is. That distinction is
   * only worth making now the coordinates are geocoded to street level; against the old
   * postcode centroids a close zoom would have pointed confidently at the wrong place.
   */
  focusZoom?: number;
  /**
   * Whether to animate the selected marker in.
   *
   * On the finder, yes: the selection changes as someone clicks around, and growing the
   * marker is what shows which one they just picked.
   *
   * On a station page, no. The selection is fixed at mount and derived from the route,
   * so there is nothing to animate between. Worse, the tween's first frame paints the
   * marker at its inactive value, overwriting the resting state the layer was declared
   * with; if that animation is then interrupted the marker is simply left switched off.
   * That is the race behind a glow that only appeared after a reload. With no tween the
   * declared state stands on its own and there is no moment it can be wrong.
   */
  animateSelection?: boolean;
  hoveredSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  mapboxToken: string;
  className?: string;
}

const DOTS_LAYER = "wattup-dots";
const LABELS_LAYER = "wattup-labels";
const PULSE_LAYER = "wattup-corridor-pulse";
const ACTIVE_RIPPLE_LAYER = "wattup-active-ripple";
/** Browsing the network: the selected site plus its neighbours and the corridor. */
const NETWORK_ZOOM = 10.5;

const ACTIVE_GLOW_LAYER = "wattup-active-glow";
const ACTIVE_DOT_LAYER = "wattup-active-dot";
const HOVER_DOT_LAYER = "wattup-hover-dot";
const HIT_LAYER = "wattup-hit";

/**
 * Radius of the invisible target around each marker, in pixels.
 *
 * Mapbox hit-tests the circle it actually drew, so a 5.5px dot gives a 5.5px target and
 * the pointer had to be dead centre before anything responded. This layer is fully
 * transparent and never seen; it exists only to be the thing queried, which is what
 * gives the marker a comfortable reach without making it look bigger.
 */
const HIT_RADIUS = 20;

/** How long the active marker takes to grow in or fall away. */
const ACTIVE_TWEEN_MS = 320;

/**
 * Grace period before the marker is allowed to shrink.
 *
 * Clicking a marker made it grow, shrink and grow again. Hover grew it, the map then
 * flew to the station so the pointer was no longer over the marker and hover cleared,
 * and only afterwards did the selection arrive through the URL and grow it back. Waiting
 * briefly before shrinking lets the selection land first, so the three steps collapse
 * into one. It also stops the marker flickering when the pointer crosses an edge.
 */
const SHRINK_GRACE_MS = 160;

/** The halo's opacity, held steady so it never fades while a station is active. */
const ACTIVE_GLOW_OPACITY = 0.6;

/** One expansion of the ripple, in milliseconds. */
const RIPPLE_MS = 2200;

/** The ring grows between these radii as it fades out. */
const RIPPLE_FROM = 10;
const RIPPLE_TO = 46;

/**
 * The halo's radius, fixed.
 *
 * Animating this outward from a small value made the marker ripple rather than grow: the
 * halo swelling is a much larger visual event than the dot scaling, and it reads as a
 * pulse. It is simply larger now, and only the dot moves.
 */
const ACTIVE_GLOW_RADIUS = 48;

/** Radii the active dot scales between, in pixels. */
const ACTIVE_DOT_FROM = 5.5;
const ACTIVE_DOT_TO = 9.5;

/** Eased at both ends, so growing in and falling away are equally soft. */
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Whether a layer is on the map right now.
 *
 * `map.getLayer` reads straight through `map.style`, which is absent both before the
 * first style arrives and after the map has been torn down, so it throws on a map that
 * merely has nothing rather than returning nothing. Two moments make that reachable:
 * a basemap swap, and an unmount, since React re-runs passive effects when it
 * reconnects a tree and by then the page's map is already gone.
 *
 * Every read of a layer goes through here, so a frame loop or an effect firing at the
 * edges of a map's life finds it absent instead of crashing the page.
 */
function hasLayer(map: MapboxMap | undefined, id: string): map is MapboxMap {
  if (!map?.style) return false;
  try {
    return Boolean(map.getLayer(id));
  } catch {
    return false;
  }
}

/**
 * Eased at both ends, so growing in and falling away are equally soft.
 *
 * Clamped on the way in and out. The cubic on either side of the midpoint returns values
 * a fraction beyond the range for inputs a fraction beyond it, and Mapbox validates
 * circle-opacity against a hard minimum of zero: an eased result of -7e-8 was enough to
 * be rejected outright and logged as an error.
 */
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return clamp01(x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
};

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

/**
 * A marker keeps its own tier's colour when hovered or selected.
 *
 * The emphasis is size and, for a selection, the halo. Recolouring a 2027 site to the
 * accent on selection said it had become a 2026 site, which is the one thing the two
 * colours are there to tell apart.
 */
const TIER_COLOR: ExpressionSpecification = [
  "case",
  ["==", ["get", "lead"], 1],
  ACCENT,
  MUTED_DOT,
];
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
  focusZoom = NETWORK_ZOOM,
  animateSelection = true,
  hoveredSlug,
  onSelect,
  onHover,
  mapboxToken,
  className,
}: StationMapProps) {
  const mapRef = useRef<MapRef>(null);
  /**
   * Whether the map has finished loading.
   *
   * Every effect below reaches for `mapRef.current?.getMap()`, which is null until the
   * map mounts. On the finder that never showed, because selection changes come from a
   * click long after load and the effect re-runs then. On a station page the selection
   * is fixed at mount: the effects ran once against a null map, bailed out, and had no
   * dependency that would ever change to bring them back. The marker stayed inert and
   * the camera never moved. This is the dependency that brings them back.
   */
  const [mapReady, setMapReady] = useState(false);

  /**
   * Whether the marker layers exist yet.
   *
   * Loading the map is not the same event as having its layers. react-map-gl adds them
   * as children, after load, and `paintIfPresent` deliberately skips a layer that is not
   * there rather than letting Mapbox throw. So a tween that runs on load alone paints
   * nothing at all and never runs again.
   *
   * That gap is invisible on a hard load, where the layers happen to be in place by the
   * time the effect runs, and reliably open on a client side navigation from /locations,
   * where the marker arrived inert. `styledata` is the event that fires as layers are
   * added, and it fires again after a basemap swap, which is the other moment every
   * layer is recreated.
   */
  const [layersReady, setLayersReady] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  /** Where each marker state's animation currently sits, 0 to 1. */
  const hoverProgress = useRef(0);
  const selectProgress = useRef(0);

  /**
   * The latest paint appliers, reachable from checkReady.
   *
   * checkReady is passed to <Map> as an event prop and is deliberately dependency free,
   * so it cannot close over applySelection/applyHover directly: those are defined below
   * it and change identity whenever their own dependencies do. Refs give it the current
   * pair without making the whole callback churn on every render.
   */
  const applySelectionRef = useRef<(eased: number) => void>(() => {});
  const applyHoverRef = useRef<(eased: number) => void>(() => {});
  const animateSelectionRef = useRef(true);
  /** The station each tween was last for, so a change of marker restarts the growth. */
  const previousHover = useRef<string | null>(null);
  const previousSelected = useRef<string | null>(null);
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
          lead: station.status === "LIVE" ? 1 : 0,
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
   * The dashed connector, west to east across the sites that are open.
   *
   * Carried over from the reference, where it traces a driving route. WattUp has no
   * route between these sites, so this is a graphic device and nothing more.
   */
  const corridor = useMemo(() => {
    const leads = orderByProximity(
      stations.filter((station) => station.status === "LIVE"),
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
    let [west, east] = trim(stations.map((s) => s.longitude));
    let [south, north] = trim(stations.map((s) => s.latitude));

    // A single station, or several at one point, gives a box with no area, and fitting
    // one of those pins the camera at maximum zoom over a blank tile, so the box is
    // padded out to something with streets in it.
    //
    // Roughly five miles, which puts the surrounding streets in frame.
    const MIN_SPAN = 0.08;
    if (east - west < MIN_SPAN) {
      const midpoint = (east + west) / 2;
      west = midpoint - MIN_SPAN / 2;
      east = midpoint + MIN_SPAN / 2;
    }
    if (north - south < MIN_SPAN) {
      const midpoint = (north + south) / 2;
      south = midpoint - MIN_SPAN / 2;
      north = midpoint + MIN_SPAN / 2;
    }

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

  /**
   * Marks the map usable once its marker layers actually exist.
   *
   * Driven by the Map's own events rather than by an effect that reaches for
   * `mapRef.current`: on a client side navigation from /locations, `load` does not fire
   * on the new instance at all, so anything hung off it never runs. `styledata` and
   * `idle` both do, and both fire again after a basemap swap, which is the other moment
   * every layer is recreated.
   */
  const checkReady = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    setMapReady(true);

    const present = hasLayer(map, ACTIVE_DOT_LAYER);
    setLayersReady(present);
    if (!present) return;

    // Re-assert whatever the tween last painted. Layers are recreated at the paint
    // values declared in JSX every time the style settles, which silently undoes a
    // completed tween: the marker was painted correctly and then reset to a plain dot a
    // moment later, with no dependency left to change and bring the tween back.
    //
    // Idempotent by design. Mid-tween this repaints the current frame and the animation
    // carries on; after one it repaints the final value.
    // Only where the tween owns these values. Without a tween, selectProgress is 0 and
    // re-asserting it would paint the marker inactive over the resting state the layer
    // declares, which is the very thing this is supposed to protect.
    if (animateSelectionRef.current) {
      applySelectionRef.current(easeInOut(selectProgress.current));
    }
    applyHoverRef.current(easeInOut(hoverProgress.current));
  }, []);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    // resize first: the map can mount before its container has been laid out, and a fit
    // computed against the wrong size lands at the wrong zoom.
    map.resize();
    // Only frame the whole set when nothing is selected. On a station page the selection
    // effect has usually started its flyTo by the time `load` arrives, and a fitBounds
    // with duration 0 snapped the camera back on top of it: the map ended up framing the
    // padded bounds instead of the station, every time.
    if (!selectedSlug) {
      map.fitBounds(bounds, { padding: 56, duration: 0 });
    }
    applyStyle();
    checkReady();
  }, [bounds, applyStyle, checkReady, selectedSlug]);

  // Selecting from the strip or the list should move the map, not just recolour a dot.
  // Gated on mapReady so a selection that is already set at mount, which is every
  // station page, still moves the camera once there is a camera to move.
  useEffect(() => {
    if (!mapReady) return;
    const station = stations.find((s) => s.slug === selectedSlug);
    if (!station) return;
    mapRef.current?.getMap().flyTo({
      center: [station.longitude, station.latitude],
      zoom: focusZoom,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900,
    });
  }, [selectedSlug, stations, mapReady, focusZoom]);

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
      if (!hasLayer(map, PULSE_LAYER)) return;
      const head = ((now - started) % PULSE_DURATION_MS) / PULSE_DURATION_MS;
      try {
        map.setPaintProperty(PULSE_LAYER, "line-gradient", pulseGradient(head));
      } catch {
        // The layer can disappear between the check above and this call while a new
        // basemap style is loading.
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

    // Guarded on the style for the same reason paintIfPresent is: re-observing fires an
    // immediate callback, and React re-runs this effect when it reconnects the tree,
    // which can be after the map it belongs to has been removed.
    const observer = new ResizeObserver(() => {
      const map = mapRef.current?.getMap();
      if (map?.style) map.resize();
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  /**
   * Drives one marker state's 0 to 1 progress.
   *
   * Mapbox will not transition a paint property whose value comes from a data
   * expression, and the base markers size themselves with ["case", ["get", ...]], so a
   * transition on them never fires. Each state therefore gets its own layer, filtered to
   * a single feature, whose radius is a plain number that can be driven frame by frame.
   *
   * Growing starts at once. Shrinking waits out a short grace period first, so a marker
   * does not flicker when the pointer crosses its edge, and so clicking does not shrink
   * the marker in the gap between hover clearing and the selection arriving.
   */
  const useMarkerTween = (
    slug: string | null,
    progress: React.RefObject<number>,
    previous: React.RefObject<string | null>,
    apply: (eased: number) => void,
    /**
     * Passed in rather than closed over.
     *
     * It is component state either way, but exhaustive-deps cannot tell that from inside
     * a hook declared in the component body and reads it as an outer scope value, which
     * it then reports as an invalid dependency. As a parameter it is unambiguous, and the
     * effect genuinely does need to re-run when the map arrives.
     */
    ready: boolean,
  ) => {
    useEffect(() => {
      const map = mapRef.current?.getMap();
      if (!map || !ready) return;

      const target = slug ? 1 : 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Moving straight to another marker restarts the growth, so it grows in the same
      // way it would from nothing rather than appearing already at full size.
      const movedToAnother = slug !== null && slug !== previous.current;
      previous.current = slug;
      const from = reduced ? target : movedToAnother ? 0 : progress.current;

      let frame = 0;
      const paint = (value: number) => {
        progress.current = value;
        try {
          apply(easeInOut(value));
        } catch {
          // The layers go away for a moment while a new basemap style loads.
        }
      };

      if (reduced || from === target) {
        paint(target);
        return;
      }

      const run = () => {
        const begun = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - begun) / ACTIVE_TWEEN_MS);
          paint(from + (target - from) * t);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      };

      if (target === 1) {
        run();
        return () => cancelAnimationFrame(frame);
      }

      const delay = window.setTimeout(run, SHRINK_GRACE_MS);
      return () => {
        window.clearTimeout(delay);
        cancelAnimationFrame(frame);
      };
      // option.style is a dependency because switching basemap recreates every layer at
      // the paint values declared in JSX, which are the start of the tween.
      // ready is one because a station page's selection never changes: without it the
      // effect runs once against a map that does not exist yet and never again.
    }, [slug, apply, previous, progress, ready]);
  };

  // Hover only scales the dot. Selection is what adds the halo, so the two states read
  // differently rather than the second being a louder version of the first.
  /**
   * Sets a paint property only once its layer exists.
   *
   * Layers are added by react-map-gl as children, which happens after the map itself is
   * ready. Returning to this page remounted the map and ran the effects below before the
   * layers were back, and Mapbox throws on an unknown layer rather than ignoring it. The
   * same gap opens for a moment whenever the basemap style is swapped, and again once
   * the map has been removed: the caller below re-runs whenever React reconnects this
   * tree, which happens after the page it belonged to has gone.
   */
  const paintIfPresent = useCallback(
    (layer: string, property: "circle-radius" | "circle-opacity", value: number) => {
      const map = mapRef.current?.getMap();
      if (!hasLayer(map, layer)) return;
      try {
        map.setPaintProperty(layer, property, value);
      } catch {
        // The layer can go between the check above and this call while a style loads.
      }
    },
    [],
  );

  const applyHover = useCallback(
    (eased: number) => {
      paintIfPresent(
        HOVER_DOT_LAYER,
        "circle-radius",
        ACTIVE_DOT_FROM + (ACTIVE_DOT_TO - ACTIVE_DOT_FROM) * eased,
      );
    },
    [paintIfPresent],
  );

  const applySelection = useCallback(
    (eased: number) => {
      paintIfPresent(
        ACTIVE_DOT_LAYER,
        "circle-radius",
        ACTIVE_DOT_FROM + (ACTIVE_DOT_TO - ACTIVE_DOT_FROM) * eased,
      );
      // Clamped again at the point of use: opacity is the one property here with a range
      // Mapbox enforces, so it is worth guarding even though the easing already clamps.
      paintIfPresent(
        ACTIVE_GLOW_LAYER,
        "circle-opacity",
        clamp01(ACTIVE_GLOW_OPACITY * eased),
      );
    },
    [paintIfPresent],
  );

  applySelectionRef.current = applySelection;
  applyHoverRef.current = applyHover;
  animateSelectionRef.current = animateSelection;

  useMarkerTween(hoveredSlug, hoverProgress, previousHover, applyHover, layersReady);
  useMarkerTween(
    selectedSlug,
    selectProgress,
    previousSelected,
    applySelection,
    layersReady && animateSelection,
  );

  // Re-apply after a basemap change, which recreates every layer at its declared paint.
  useEffect(() => {
    applyHover(easeInOut(hoverProgress.current));
    applySelection(easeInOut(selectProgress.current));
  }, [option.style, applyHover, applySelection]);

  /**
   * The ripple on the selected marker.
   *
   * A ring that grows out of the dot and fades, once every couple of seconds. It reads
   * as a live signal rather than as a highlight, which is the point on a page about one
   * station: it says this is the place, without a second colour or a larger dot.
   *
   * Driven on a frame loop for the same reason the marker tween is: Mapbox will not
   * transition a paint property, so nothing animates unless it is written per frame. It
   * does not run under reduced motion, or while the tab is in the background.
   */
  useEffect(() => {
    if (!selectedSlug) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let lastPaint = 0;
    const started = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || now - lastPaint < 33) return;
      lastPaint = now;

      const map = mapRef.current?.getMap();
      if (!hasLayer(map, ACTIVE_RIPPLE_LAYER)) return;
      const t = ((now - started) % RIPPLE_MS) / RIPPLE_MS;
      try {
        map.setPaintProperty(
          ACTIVE_RIPPLE_LAYER,
          "circle-radius",
          RIPPLE_FROM + (RIPPLE_TO - RIPPLE_FROM) * t,
        );
        // The ring is the stroke, so that is what fades; the fill stays transparent.
        // It is never fully opaque even at the start, since a ring arriving at full
        // strength reads as a second marker rather than as a pulse.
        map.setPaintProperty(
          ACTIVE_RIPPLE_LAYER,
          "circle-stroke-opacity",
          clamp01(0.55 * (1 - t) ** 1.6),
        );
      } catch {
        // The layer can go while a basemap style is loading.
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [selectedSlug]);

  const onClick = useCallback(
    (event: MapMouseEvent) => onSelect(slugAt(event)),
    [onSelect],
  );

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
      // load alone is not enough: it does not fire for the instance created by a client
      // side navigation, and even when it does the marker layers are added after it.
      onStyleData={checkReady}
      onIdle={checkReady}
      onClick={onClick}
      onMouseMove={(event) => onHover(slugAt(event))}
      onMouseLeave={() => onHover(null)}
      // Only the transparent target is queried. Hit-testing the visible dots as well
      // would just shrink the reach back to whichever the pointer happened to be over.
      interactiveLayerIds={[HIT_LAYER]}
      // A marker is clickable, so it should say so. Everything else keeps the grab
      // cursor the map itself provides for panning.
      cursor={hoveredSlug ? "pointer" : undefined}
      // Disabled here so the compact control below can replace it, not to remove the
      // credit: Mapbox's terms require attribution to stay visible.
      attributionControl={false}
      // Deliberately not reuseMaps.
      //
      // It handed the station page the very map the finder had been using, layers and
      // all. Clicking a card re-renders the finder first, without `sel` in the URL, so
      // it deselects its marker; the station page then mounted onto that map and got a
      // dot with no halo and no ripple, while a hard load of the same URL was correct.
      //
      // Remounting does not put it right. react-map-gl's Layer sees its id already in
      // the style and takes the update path, which diffs the new props against the
      // previous ones: on a first render those are the same object, so every comparison
      // says unchanged and nothing at all is written. Source behaves the same way, so
      // the station data was inherited too. Anything that differs between the two pages
      // is silently the other page's value.
      //
      // A fresh map per page costs an init we would rather not pay. Carrying one page's
      // state into another and being wrong about it costs more.
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
        {/* Below everything and fully transparent: the target, not a marker. */}
        <Layer
          id={HIT_LAYER}
          type="circle"
          paint={{ "circle-radius": HIT_RADIUS, "circle-opacity": 0 }}
        />

        <Layer {...dots} />

        {/* Hovering scales the dot and nothing else. */}
        <Layer
          id={HOVER_DOT_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], hoveredSlug ?? "\u0000"]}
          paint={{
            "circle-color": TIER_COLOR,
            // Hover is always animated, on both pages, so this stays at the resting size
            // and the tween grows it.
            "circle-radius": ACTIVE_DOT_FROM,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": option.detailed ? "#FFFFFF" : WATER_COLOR,
            "circle-opacity": 1,
          }}
        />

        {/* Selecting adds the halo. Filtered to one feature so both radii are plain
            numbers the frame loops above can drive. */}
        <Layer
          id={ACTIVE_RIPPLE_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], selectedSlug ?? "\u0000"]}
          paint={{
            "circle-color": "rgba(0,0,0,0)",
            "circle-radius": RIPPLE_FROM,
            "circle-opacity": 0,
            "circle-stroke-width": 2,
            "circle-stroke-color": TIER_COLOR,
            "circle-stroke-opacity": 0,
          }}
        />
        <Layer
          id={ACTIVE_GLOW_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], selectedSlug ?? "\u0000"]}
          paint={{
            "circle-color": TIER_COLOR,
            "circle-blur": 0.9,
            "circle-radius": ACTIVE_GLOW_RADIUS,
            // Declared at the value the selection should already have, not at zero.
            //
            // Mapbox recreates every layer at these values whenever the style settles,
            // which silently undid whatever the tween had painted. Declaring the resting
            // state here makes the correct appearance the thing that survives, and
            // leaves the tween as the animation between states rather than the only
            // thing that ever produces one. A station page, where the selection is fixed
            // at mount and the tween has no later event to re-run on, is then right
            // whether the tween fires or not.
            "circle-opacity": selectedSlug ? ACTIVE_GLOW_OPACITY : 0,
          }}
        />
        <Layer
          id={ACTIVE_DOT_LAYER}
          type="circle"
          filter={["==", ["get", "slug"], selectedSlug ?? "\u0000"]}
          paint={{
            // Identical to the base markers, only larger. Giving the active one its own
            // treatment made it read as a different kind of thing rather than as the
            // same marker singled out.
            "circle-color": TIER_COLOR,
            // Declared at the selected size, like the glow above, so a page whose
            // selection comes from the route is correct without waiting on a tween.
            "circle-radius": selectedSlug ? ACTIVE_DOT_TO : ACTIVE_DOT_FROM,
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
