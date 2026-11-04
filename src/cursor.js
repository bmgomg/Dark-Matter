import { R } from './const';

// The pointer over the map: an arrow with the brush picked in the palette attached, the planet (sized as the
// palette's, in the board's ratios) or, for an empty cell, the cross. A cursor image can't reach the page's own
// defs, so the planets' art is copied into each one from Defs.

const SIZE = 48;
// the planet or cross hangs from the arrow's tail, its centre this far out along the diagonal, plus its radius
const AT = [13, 15];
// the large planet's radius; the others in the board's ratios
const LARGE = 15;

const ARROW = 'M1 1 L1 19 L5.6 14.8 L8.8 22 L12.2 20.6 L9.1 13.6 L15 13.6 Z';

const cache = {};

const art = (v) => {
	const r = v ? (R[v] / R[3]) * LARGE : 7;
	const [x, y] = AT.map((a) => a + r * 0.75);

	if (v) {
		return `<use href="#planet-${v}" transform="translate(${x} ${y}) scale(${r})"/>`;
	}

	const k = 5;
	const d = `M${x - k} ${y - k} L${x + k} ${y + k} M${x + k} ${y - k} L${x - k} ${y + k}`;
	return (
		`<path d="${d}" stroke="#0d0b24" stroke-width="6" stroke-linecap="round"/>` +
		`<path d="${d}" stroke="#d8d2ff" stroke-width="3" stroke-linecap="round"/>`
	);
};

// the CSS cursor for a brush, or undefined before the page's defs are there
export const brushCursor = (v) => {
	if (cache[v]) {
		return cache[v];
	}

	const defs = typeof document !== 'undefined' && document.querySelector('.defs defs');

	if (!defs) {
		return undefined;
	}

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
		new XMLSerializer().serializeToString(defs) +
		art(v) +
		`<path d="${ARROW}" fill="#f4f1ff" stroke="#0d0b24" stroke-width="1.6" stroke-linejoin="round"/>` +
		'</svg>';

	cache[v] = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 1 1, pointer`;
	return cache[v];
};
