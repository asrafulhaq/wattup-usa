"use client";

import { MapCanvas } from "@/components/locations/map/map-canvas";
import type { PublicStation } from "@/lib/locations/types";
import { useState } from "react";

interface MapCanvasClientProps {
  /**
   * The whole network, not just this page's station.
   *
   * The station page shows the same map the finder does, with this site selected: its
   * neighbours and the corridor between them are the context that makes one glowing dot
   * legible as part of a network. Passed one station it drew a lone dot on an empty
   * basemap, which read as a map that had failed to load rather than as a location.
   */
  stations: PublicStation[];
  /** The station this page is about. Selected on arrival, and never changes here. */
  selectedSlug: string;
  mapboxToken: string | null;
  className?: string;
}

/** How close to sit when the station is selected. Matches the finder exactly. */
const STATION_ZOOM = 10.5;

/**
 * A read-only map for one station, drawn against the whole network.
 *
 * MapCanvas is driven by selection and hover from its parent. There is nothing to choose
 * between here, so only hover is held locally and the page stays a server component.
 * Selecting is a no-op: the station is the page.
 */
export function MapCanvasClient({
  stations,
  selectedSlug,
  mapboxToken,
  className,
}: MapCanvasClientProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <MapCanvas
      stations={stations}
      selectedSlug={selectedSlug}
      hoveredSlug={hovered}
      onSelect={() => undefined}
      onHover={setHovered}
      focusZoom={STATION_ZOOM}
      // Derived from the route, not animated: see StationMap's animateSelection.
      animateSelection={false}
      mapboxToken={mapboxToken}
      className={className}
    />
  );
}
