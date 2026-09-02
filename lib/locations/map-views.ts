export type MapView = "map" | "satellite" | "terrain" | "minimal";

export interface MapViewOption {
  id: MapView;
  label: string;
  style: string;
  /** Whether the basemap keeps its roads, labels and route shields. */
  detailed: boolean;
}

/**
 * The basemaps offered under the map.
 *
 * "minimal" is the house style: the reference's dark field and flat regions, with roads
 * and place names kept but pulled back so they sit under the markers rather than
 * competing with them. Points of interest, landuse, parks and hillshade are dropped,
 * since those are what turn a dark basemap into blotches.
 *
 * The other three are the stock Mapbox basemaps, untouched. A driver deciding whether to
 * pull off a freeway wants the route shield, the junction and the frontage, and those
 * should look exactly as they do on every other map they have used.
 */
export const MAP_VIEWS: MapViewOption[] = [
  {
    id: "map",
    label: "Map",
    style: "mapbox://styles/mapbox/streets-v12",
    detailed: true,
  },
  {
    id: "satellite",
    label: "Satellite",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    detailed: true,
  },
  {
    id: "terrain",
    label: "Terrain",
    style: "mapbox://styles/mapbox/outdoors-v12",
    detailed: true,
  },
  {
    id: "minimal",
    label: "Minimal",
    style: "mapbox://styles/mapbox/dark-v11",
    detailed: false,
  },
];

/**
 * Minimal opens the section: it is the styled view the design was built around, and the
 * detailed basemaps are one click away for anyone who wants the road network.
 */
export const DEFAULT_MAP_VIEW: MapView = "minimal";

export function viewOption(view: MapView): MapViewOption {
  return MAP_VIEWS.find((option) => option.id === view) ?? MAP_VIEWS[0];
}
