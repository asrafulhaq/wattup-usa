"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { statusLabel } from "@/lib/locations/public";
import type { PublicStation } from "@/lib/locations/types";
import type { LngLatBoundsLike } from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

const LAND_COLOR = "#E4EAF2";
const WATER_COLOR = "#F2F5FA";

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

  const bounds = useMemo<LngLatBoundsLike>(() => {
    const lons = stations.map((s) => s.longitude);
    const lats = stations.map((s) => s.latitude);
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
  }, [stations]);

  /** Strips the basemap back to land and water, then recolours both. */
  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Fit explicitly rather than relying on initialViewState.bounds: the map is mounted
    // before its container has been laid out, so the initial fit is computed against the
    // wrong size and lands zoomed far too far out.
    map.fitBounds(bounds, { padding: 64, duration: 0 });

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
    for (const [id, color] of [
      ["land", LAND_COLOR],
      ["background", LAND_COLOR],
      ["water", WATER_COLOR],
    ] as const) {
      try {
        map.setPaintProperty(id, id === "water" ? "fill-color" : "background-color", color);
      } catch {
        // ignore: not every style exposes these ids
      }
    }
    try {
      map.setPaintProperty("land", "background-color", LAND_COLOR);
    } catch {
      // ignore
    }
  }, [bounds]);

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
      "circle-color": [
        "case",
        ["==", ["get", "lead"], 1],
        "#197dff",
        "#94a3b8",
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
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
      "text-color": ["case", ["==", ["get", "lead"], 1], "#26313f", "#7c8899"],
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.4,
    },
  };

  return (
    <div className={className}>
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      initialViewState={{ bounds, fitBoundsOptions: { padding: 64 } }}
      mapStyle="mapbox://styles/mapbox/light-v11"
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
      <Source id="wattup-stations" type="geojson" data={geojson}>
        <Layer {...dots} />
        <Layer {...labels} />
      </Source>
    </Map>
    </div>
  );
}
