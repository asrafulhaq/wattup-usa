import { CA_PROJECTION } from "./ca-geometry";

export interface Point {
  x: number;
  y: number;
}

/**
 * Projects a coordinate into the same viewBox space the county paths were baked in.
 *
 * The bounds come from the generated geometry file rather than being repeated here, so
 * a regenerated basemap cannot drift out of alignment with the markers drawn over it.
 */
export function project(latitude: number, longitude: number): Point {
  const { minX, maxX, minY, maxY, width, height } = CA_PROJECTION;
  const x = (longitude * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
  return {
    x: ((x - minX) / (maxX - minX)) * width,
    y: ((maxY - y) / (maxY - minY)) * height,
  };
}

export const VIEWBOX = `0 0 ${CA_PROJECTION.width} ${CA_PROJECTION.height}`;
