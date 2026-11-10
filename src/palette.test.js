import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUE, MONO_VAR, SAT, hex, shade } from './palette';

// The Monochrome Jam allows one hue. Every color in the game's code is to come from palette.js; these look through the
// source, and what ships with it, for any that doesn't. (The images are checked by eye: src/lib/images/BMG.webp, the
// one left, was made from the hue.)

const files = (dir, ext) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? files(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : []
	);

const SOURCES = [
	...files('src', /\.(svelte|js|html|css)$/).filter((f) => !/(palette(\.test)?|puzzles)\.js$/.test(f)),
	'static/manifest.json',
	'static/favicon.svg',
	'scripts/icon.html'
].map((f) => [f, readFileSync(f, 'utf8')]);

// the hue of a hex color, or null for a gray, which has none
const hueOf = (h) => {
	const v = h.length <= 4 ? [...h.slice(1, 4)].map((c) => parseInt(c + c, 16)) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const [r, g, b] = v;
	const max = Math.max(...v);
	const c = max - Math.min(...v);

	if (c === 0) {
		return null;
	}

	const k = max === r ? ((g - b) / c + 6) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
	return k * 60;
};

const matches = (re) => SOURCES.flatMap(([f, s]) => [...s.matchAll(re)].map((m) => `${f}: ${m[0]}`));

describe('one hue', () => {
	it('palette.js makes its colors from it', () => {
		expect(MONO_VAR).toBe(`${HUE} ${SAT}%`);
		expect(shade(40)).toBe(`hsl(${HUE} ${SAT}% 40%)`);
		expect(shade(40, 0.5)).toBe(`hsl(${HUE} ${SAT}% 40% / 0.5)`);
		expect(hex(0)).toBe('#000000');
		expect(hex(100)).toBe('#ffffff');

		for (let l = 5; l <= 95; l += 5) {
			expect(Math.abs(hueOf(hex(l)) - HUE)).toBeLessThan(3);
		}
	});

	// (to the nearest of 256 levels a channel: near black or white, that can turn the hue a few degrees)
	it('any hex color is a shade of the hue', () => {
		const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
		const SHADES = Array.from({ length: 1001 }, (_, k) => rgb(hex(k / 10)));
		const off = matches(/#[0-9a-fA-F]{6}(?![\w-])/g).filter((m) => {
			const c = rgb(m.split(': ')[1]);
			return !SHADES.some((s) => s.every((v, i) => Math.abs(v - c[i]) <= 1));
		});
		expect(off).toEqual([]);
		// (none short, which would skip the check above)
		expect(matches(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{4})(?![\w-])/g)).toEqual([]);
	});

	it('hex colors only where CSS and SVG attributes can’t be reached', () => {
		const allowed = ['src/app.html', 'static/manifest.json', 'static/favicon.svg'];
		const found = matches(/#[0-9a-fA-F]{3,8}(?![\w-])/g).filter((m) => !allowed.some((f) => m.startsWith(f)));
		expect(found).toEqual([]);
	});

	it('every hsl() is the hue, through --mono', () => {
		expect(matches(/hsla?\((?!var\(--mono\) )[^)]*\)/g)).toEqual([]);
	});

	it('no other color functions', () => {
		expect(matches(/\b(rgba?|hwb|lab|lch|oklab|oklch|color)\(/g)).toEqual([]);
		expect(matches(/color-mix\((?!in srgb)/g)).toEqual([]);
	});

	it('no named colors', () => {
		const NAMES =
			'black|white|gray|grey|silver|red|maroon|crimson|pink|orange|gold|yellow|olive|lime|green|teal|aqua|cyan|blue|navy|indigo|purple|violet|magenta|fuchsia|lavender|brown|tan|beige|ivory|coral|salmon|tomato|orchid|plum|khaki';
		const css = new RegExp(
			`(?:^|[;{\\s'"])(?:color|background(?:-color|-image)?|fill|stroke|border(?:-\\w+)*|outline(?:-color)?|box-shadow|text-shadow|filter|stop-color|caret-color)\\s*:[^;}]*(?<![\\w-])(?:${NAMES})(?![\\w-])`,
			'gim'
		);
		const attr = new RegExp(`\\b(?:fill|stroke|stop-color|color)=["'](?:${NAMES})["']`, 'gi');
		expect([...matches(css), ...matches(attr)]).toEqual([]);
	});

	it('no filter that scales or turns the channels', () => {
		expect(matches(/\b(brightness|saturate|hue-rotate|sepia|grayscale|invert|contrast)\(/g)).toEqual([]);
	});
});
