// The math behind MomentumExplorer: gradient descent with and without momentum on a long, narrow
// quadratic valley, f(u, v) = (a u² + b v²) / 2.

export const A = 1; // curvature along the valley
export const B = 12; // curvature across it
export const START: Point = [-10, 1.4];
/** The visible part of the plane: u from -11 to 9, v from -4 to 4. */
export const VIEW = { u: [-11, 9], v: [-4, 4] } as const;

export type Point = [number, number];

export const f = ([u, v]: Point): number => (A * u * u + B * v * v) / 2;

/** Iterates of z ← βz + ∇f(w), w ← w − αz, starting at START (Goh 2017, eq. 2). */
export function descend(alpha: number, beta: number, steps: number): Point[] {
  const path: Point[] = [START];
  let [u, v] = START;
  let [zu, zv] = [0, 0];
  for (let k = 0; k < steps; k++) {
    zu = beta * zu + A * u;
    zv = beta * zv + B * v;
    u -= alpha * zu;
    v -= alpha * zv;
    path.push([u, v]);
  }
  return path;
}

/** Steps until f falls below a millionth of its start, or undefined if not within `limit`. */
export function stepsToConverge(alpha: number, beta: number, limit = 2000): number | undefined {
  const target = f(START) * 1e-6;
  const path = descend(alpha, beta, limit);
  const k = path.findIndex((p) => f(p) < target);
  return k === -1 ? undefined : k;
}

/** Contour levels, from the one through the start inward. */
export const levels = Array.from({ length: 7 }, (_, i) => f(START) * 0.42 ** i);

/** Semi-axes of the ellipse f = c. */
export const ellipse = (c: number): Point => [Math.sqrt((2 * c) / A), Math.sqrt((2 * c) / B)];
