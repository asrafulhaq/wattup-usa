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
  return (
    <div className={`relative ${className ?? ""}`}>
      {mapboxToken ? (
        <StationMap {...rest} mapboxToken={mapboxToken} className="h-full w-full" />
      ) : (
        <CaliforniaMap {...rest} className="h-full w-full" />
      )}

      {/*
        The reference lights its field from the top left and falls away to the bottom
        right, about 40 luminance points across the frame. Flat colour reads noticeably
        more clinical than the reference, and a map canvas cannot carry a gradient of its
        own, so it goes over the top. It must not intercept clicks meant for the map.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_12%_8%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_45%,rgba(37,52,74,0.07)_100%)]"
      />
    </div>
  );
}
