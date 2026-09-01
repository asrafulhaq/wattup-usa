"use client";

import { CaliforniaMap } from "@/components/locations/map/california-map";
import type { PublicStation } from "@/lib/locations/types";
import dynamic from "next/dynamic";

/**
 * Mapbox GL is roughly 230 KB before it fetches a tile, so it is loaded on demand rather
 * than shipped in the page bundle. The server-rendered placeholder holds the slot, which
 * keeps the largest paint off the map entirely.
 */
const StationMap = dynamic(
  () => import("@/components/locations/map/station-map").then((m) => m.StationMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#E8EDF4]" />,
  },
);

interface MapCanvasProps {
  stations: PublicStation[];
  selectedSlug: string | null;
  hoveredSlug: string | null;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  mapboxToken: string | null;
  className?: string;
}

/**
 * Picks the renderer.
 *
 * With a token this is the real map, which is what a driver needs: street detail at
 * zoom, and a basemap that already covers Singapore and Thailand. Without one it falls
 * back to the inline SVG, which needs no network and no WebGL. That keeps a missing or
 * rate limited token from leaving a blank rectangle on the page.
 */
export function MapCanvas({ mapboxToken, className, ...rest }: MapCanvasProps) {
  if (!mapboxToken) {
    return <CaliforniaMap {...rest} className={className} />;
  }
  return <StationMap {...rest} mapboxToken={mapboxToken} className={className} />;
}
