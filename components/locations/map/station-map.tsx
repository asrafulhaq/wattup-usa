"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  DEFAULT_MAP_VIEW,
  MAP_VIEWS,
  viewOption,
  type MapView,
} from "@/lib/locations/map-views";
import { statusLabel } from "@/lib/locations/public";
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
    const leads = stations
      .filter((station) => station.goLiveYear === 2026)
      .sort((a, b) => a.longitude - b.longitude);
    return {
      type: "FeatureCollection" as const,
      features:
        leads.length < 2
          ? []
          : [
              {
                type: "Feature" as const,
                properties: {},
                geometry: {
                  type: "LineString" as const,
                  coordinates: leads.map((s) => [s.longitude, s.latitude]),
                },
              },
            ],
    };
  }, [stations]);

  const bounds = useMemo<LngLatBoundsLike>(() => {
    const lons = stations.map((s) => s.longitude);
    const lats = stations.map((s) => s.latitude);
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
  }, [stations]);

  /**
   * Applies the view.
   *
   * Runs on every style load, not just the first: switching basemap replaces the whole
   * style, so anything done here has to be redone. In the detailed views the basemap is
   * left exactly as Mapbox ships it, which is the point of them: roads, route shields,
   * place names and boundaries all present.
   */
  const applyStyle = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (option.detailed) return;

    for (const layer of map.getStyle()?.layers ?? []) {
      // Our own layers are symbol layers too, and hiding them here is what made the
      // station labels disappear. Skip anything we added.
      if (layer.id.startsWith("wattup-")) continue;
      // Every other symbol layer goes: those are the basemap's own labels, and ours
      // replace them. Line and fill layers only go if they are infrastructure.
      const drop = layer.type === "symbol" || HIDDEN_LAYER_PATTERN.test(layer.id);
      if (!drop) continue;
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // A style can rename layers between versions; a missing one is not fatal.
      }
    }
    for (const layer of map.getStyle()?.layers ?? []) {
      if (layer.id.startsWith("wattup-")) continue;
      try {
        if (layer.id === "background" || layer.id === "land") {
          map.setPaintProperty(layer.id, "background-color", LAND_COLOR);
        } else if (/water|ocean/i.test(layer.id) && layer.type === "fill") {
          map.setPaintProperty(layer.id, "fill-color", WATER_COLOR);
        } else if (BOUNDARY_LAYER_PATTERN.test(layer.id) && layer.type === "line") {
          map.setLayoutProperty(layer.id, "visibility", "visible");
          map.setPaintProperty(layer.id, "line-color", BOUNDARY_COLOR);
          map.setPaintProperty(layer.id, "line-width", 1.2);
          map.setPaintProperty(layer.id, "line-opacity", 1);
          map.setPaintProperty(layer.id, "line-dasharray", [1, 0]);
        }
      } catch {
        // A style can rename or restructure layers between versions; skipping one that
        // does not take a given property is not fatal.
      }
    }
  }, [option.detailed]);

  const onLoad = useCallback(() => {
    // Fit explicitly rather than relying on initialViewState.bounds: the map is mounted
    // before its container has been laid out, so the initial fit is computed against the
    // wrong size and lands zoomed far too far out.
    mapRef.current?.getMap().fitBounds(bounds, { padding: 64, duration: 0 });
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

  const onClick = useCallback(
    (event: MapMouseEvent) => onSelect(slugAt(event)),
    [onSelect],
  );

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
      onStyleData={applyStyle}
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

      <Source id="wattup-corridor" type="geojson" data={corridor}>
        <Layer
          id="wattup-corridor-line"
          type="line"
          paint={{
            "line-color": ACCENT,
            "line-width": 1.6,
            "line-opacity": 0.65,
            "line-dasharray": [2, 2.5],
          }}
        />
      </Source>

      <Source id="wattup-stations" type="geojson" data={geojson}>
        <Layer {...dots} />
        <Layer {...labels} />
      </Source>
    </Map>
    </div>
  );
}
