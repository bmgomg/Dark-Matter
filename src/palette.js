// Monochrome, for the Monochrome Jam (only one hue): every color in the game is this hue at this saturation, only its
// lightness changing, from black (0) to white (100). Opacity is free: blending two such colors, or one with black or
// white, keeps the hue, so glows, gradients and antialiasing stay in it too. What could leave it: a hue or saturation
// of its own, a named color, a hex color, or a filter that scales or clips the channels (brightness(), saturate(),
// hue-rotate()); src/palette.test.js looks for them.
export const HUE = 248;
export const SAT = 70;

// a color at lightness l (0 to 100), at opacity a, for SVG attributes and the canvas, where CSS can't reach
export const shade = (l, a = 1) => `hsl(${HUE} ${SAT}% ${l}%${a < 1 ? ` / ${a}` : ''})`;

// the same for CSS, set on the root by +layout.svelte: hsl(var(--mono) <lightness>% [/ <opacity>])
export const MONO_VAR = `${HUE} ${SAT}%`;

// the same in hex, for the manifest and the app's theme color, which take no hsl(); l in 0 to 100
export const hex = (l) => {
	const s = SAT / 100;
	const L = l / 100;
	const k = (n) => (n + HUE / 30) % 12;
	const a = s * Math.min(L, 1 - L);
	const f = (n) => L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
	return (
		'#' +
		[0, 8, 4]
			.map((n) =>
				Math.round(f(n) * 255)
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
};
