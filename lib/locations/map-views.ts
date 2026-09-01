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
 * "minimal" is the reference look: roads, places of interest and every basemap label
 * stripped out, which is what gives that design its calm. The other three are the
 * opposite, and deliberately so: a driver deciding whether to pull off a freeway needs
 * the road number, the junction and the frontage, none of which the reference frame
 * carries. Keeping both means the section can look like the reference and still answer
 * a real question.
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

export const DEFAULT_MAP_VIEW: MapView = "map";

export function viewOption(view: MapView): MapViewOption {
  return MAP_VIEWS.find((option) => option.id === view) ?? MAP_VIEWS[0];
}
