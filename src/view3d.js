// The board as the player sees it: a square table in front of them, seen from their seat to the south, above it.
// World units: the board is BOARD wide whatever its size, centered on the origin, x east, y north, z up.
// Screen units are the board's SVG pixels, with the origin on the board's center line.

export const BOARD = 4;

// the near edge's width at rest; the horizon's lanes have the same width, so they line up under it
export const NEAR = 340;

const CAM = [0, -6, 7];
const AIM = [0, 0.3, 0];

const sub = (a, b) => a.map((v, i) => v - b[i]);
const len = (a) => Math.hypot(...a);
const fwd = sub(AIM, CAM).map((v, _, a) => v / len(a));
const up = [0, -fwd[2], fwd[1]];

const toCam = ([x, y, z]) => {
	const v = sub([x, y, z], CAM);
	return [v[0], v[1] * up[1] + v[2] * up[2], v[1] * fwd[1] + v[2] * fwd[2]];
};

// focal length: the near edge, BOARD wide, spans NEAR pixels
const F = (NEAR * toCam([0, -BOARD / 2, 0])[2]) / BOARD;

// screen position, pixels per world unit there (for sphere sizes), and depth (for drawing order)
export const project = (p) => {
	const [x, y, z] = toCam(p);
	return { x: (F * x) / z, y: (-F * y) / z, s: F / z, d: z };
};

// a point of the board turned deg clockwise, seen from above
export const turned = (x, y, deg) => {
	const t = (deg * Math.PI) / 180;
	const c = Math.cos(t);
	const s = Math.sin(t);
	return [x * c + y * s, -x * s + y * c];
};

// is a face with this outward normal, through this point, turned towards the camera?
export const facing = (normal, point) => normal.reduce((a, n, i) => a + n * (point[i] - CAM[i]), 0) < 0;

// the side facing the player at a board angle, 0..3 (South, East, North, West)
export const sideAt = (deg) => ((Math.round(deg / 90) % 4) + 4) % 4;
