export type Coord = [number, number];

/** Samples taken along each segment. Higher is smoother and heavier. */
const SAMPLES_PER_SEGMENT = 18;

/**
 * Runs a Catmull-Rom spline through the given points.
 *
 * A line drawn straight between sites reads as a series of hinges, which looks like a
 * route someone plotted by hand. A spline passes through every point but leaves in a
 * curve, which is what the reference's connector does. Catmull-Rom is used rather than a
 * Bezier because it interpolates its control points: the curve is guaranteed to touch
 * each station rather than being pulled off them.
 *
 * The ends are handled by duplicating the first and last points, so the curve starts and
 * finishes cleanly instead of overshooting.
 */
export function smoothLine(points: Coord[]): Coord[] {
  if (points.length < 3) return points;

  const padded: Coord[] = [points[0], ...points, points[points.length - 1]];
  const out: Coord[] = [];

  for (let i = 0; i < padded.length - 3; i++) {
    const [p0, p1, p2, p3] = [padded[i], padded[i + 1], padded[i + 2], padded[i + 3]];

    for (let step = 0; step < SAMPLES_PER_SEGMENT; step++) {
      const t = step / SAMPLES_PER_SEGMENT;
      const t2 = t * t;
      const t3 = t2 * t;

      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }

  out.push(points[points.length - 1]);
  return out;
}

/** The same curve as an SVG path, for the non-WebGL map. */
export function smoothPath(points: Coord[]): string {
  const curve = smoothLine(points);
  if (curve.length === 0) return "";
  return curve
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/**
 * Orders points into a path that does not double back on itself.
 *
 * Sorting sites by longitude alone ignores latitude, and with these sites that produced
 * a corridor which ran inland to Fontana, dived 50 miles south to Oceanside, then climbed
 * back north to Hesperia. It read as a mistake rather than a route.
 *
 * This walks from the westernmost point to whichever point is nearest each time, which is
 * the standard nearest neighbour heuristic. It does not find the shortest possible tour,
 * and it does not need to: the line is a graphic device, and all it has to do is stop
 * crossing itself.
 */
export function orderByProximity<T>(items: T[], coordOf: (item: T) => Coord): T[] {
  if (items.length < 3) return items;

  const remaining = [...items];
  const westernmost = remaining.reduce(
    (best, item, index) =>
      coordOf(item)[0] < coordOf(remaining[best])[0] ? index : best,
    0,
  );
  const ordered = [remaining.splice(westernmost, 1)[0]];

  while (remaining.length > 0) {
    const [fromX, fromY] = coordOf(ordered[ordered.length - 1]);
    let nearest = 0;
    let shortest = Infinity;

    remaining.forEach((item, index) => {
      const [x, y] = coordOf(item);
      // Squared distance is enough to compare, and avoids a square root per candidate.
      const distance = (x - fromX) ** 2 + (y - fromY) ** 2;
      if (distance < shortest) {
        shortest = distance;
        nearest = index;
      }
    });

    ordered.push(remaining.splice(nearest, 1)[0]);
  }

  return ordered;
}
