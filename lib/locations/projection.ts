import { CA_PROJECTION } from "./ca-geometry";

export interface Point {
  x: number;
  y: number;
}

/**
 * Decimal places kept on a projected coordinate.
 *
 * The viewBox is about 1000 units wide, so three places is well under a thousandth of a
 * pixel: visually irrelevant. It is not cosmetic, though. Math.log and Math.tan are only
 * specified to be approximately correct, so Node and the browser can disagree in the
 * final bits and produce cy="1006.3181808081831" on the server against 1006.3181808081838
 * on the client. React reads that as a hydration mismatch. Rounding makes both sides
 * agree exactly.
 */
const PRECISION = 1e3;

const round = (value: number) => Math.round(value * PRECISION) / PRECISION;

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
    x: round(((x - minX) / (maxX - minX)) * width),
    y: round(((maxY - y) / (maxY - minY)) * height),
  };
}

export const VIEWBOX = `0 0 ${CA_PROJECTION.width} ${CA_PROJECTION.height}`;
