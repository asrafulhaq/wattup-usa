"use client";

import { MapCanvas } from "@/components/locations/map/map-canvas";
import type { PublicStation } from "@/lib/locations/types";
import { useState } from "react";

interface MapCanvasClientProps {
  stations: PublicStation[];
  mapboxToken: string | null;
  className?: string;
}

/**
 * A read-only map for a single station.
 *
 * MapCanvas is driven by selection and hover from its parent. Here there is one station
 * and nothing to choose between, so the state is held locally and the page stays a
 * server component.
 */
export function MapCanvasClient({
  stations,
  mapboxToken,
  className,
}: MapCanvasClientProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <MapCanvas
      stations={stations}
      selectedSlug={stations[0]?.slug ?? null}
      hoveredSlug={hovered}
      onSelect={() => undefined}
      onHover={setHovered}
      mapboxToken={mapboxToken}
      className={className}
    />
  );
}
