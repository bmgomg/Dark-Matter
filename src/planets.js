// The planets, as SVG markup, each drawn on a unit circle (radius 1, centred on 0, 0): 1 a golden cratered moon, 2 a teal
// ocean world under swirling clouds, 3 a violet banded gas giant. Lit from the upper left, like the whole sky, and
// outlined in the dark, so one in front of another stays apart from it. A plain module, with no Svelte in it, so that
// the game (Defs.svelte) and the itch art (scripts/cover.html, scripts/rules-2.html) draw the same planets.

// each planet's colors: its gradient, lit to dark, and its markings
const P = {
	1: { lit: '#fff4d2', mid: '#f0c45e', dark: '#7d500f', maria: '#6e450c', crater: '#5e3a08' },
	2: { lit: '#d2fcff', mid: '#2bb2bd', dark: '#083f52', land: '#1d6a4a', cloud: '#ffffff' },
	3: { lit: '#ead9ff', mid: '#9a63f0', dark: '#250e58', light: '#f3e8ff', band: '#1a0840', storm: '#ffd6ec', eye: '#5a1f6e' }
};

const CRATERS = [
	[-0.38, -0.3, 0.2],
	[0.35, 0.2, 0.26],
	[-0.05, 0.62, 0.14],
	[0.62, -0.25, 0.12]
];

// a fine dark edge, in each planet's radii: about a pixel at the size it shows on the board and the tray (a picture
// that draws them larger gives its own width, or the edge comes out heavy)
const LIMB_W = { 1: 0.08, 2: 0.05, 3: 0.032 };
const limb = (w) => `<circle r="1" fill="none" stroke="#05050f" stroke-opacity="0.85" stroke-width="${w}"/>`;

// the night side and the glint, over every planet, under its limb
const SHADING = '<circle r="1" fill="url(#planet-night)"/><circle r="1" fill="url(#planet-glint)"/>';

const base = (i) => `<radialGradient id="planet-base-${i}" cx="0.36" cy="0.32" r="0.78">
	<stop offset="0" stop-color="${P[i].lit}"/>
	<stop offset="0.55" stop-color="${P[i].mid}"/>
	<stop offset="1" stop-color="${P[i].dark}"/>
</radialGradient>`;

// maria, and craters with a lit rim on the far side from the light
const moon = () => `<g id="planet-body-1">
	<circle r="1" fill="url(#planet-base-1)"/>
	<g clip-path="url(#planet-disc)">
		<path d="M -0.9 0.1 C -0.6 -0.15 -0.25 0.05 -0.1 0.35 C 0 0.6 -0.4 0.8 -0.75 0.6 Z" fill="${P[1].maria}" fill-opacity="0.28"/>
		<path d="M 0.15 -0.75 C 0.45 -0.8 0.7 -0.55 0.6 -0.3 C 0.45 -0.1 0.15 -0.3 0.15 -0.75 Z" fill="${P[1].maria}" fill-opacity="0.22"/>
		${CRATERS.map(
			([x, y, r]) =>
				`<circle cx="${x}" cy="${y}" r="${r}" fill="${P[1].crater}" fill-opacity="0.35"/>` +
				`<path d="M ${x - r * 0.8} ${y + r * 0.6} A ${r} ${r} 0 0 0 ${x + r * 0.8} ${y - r * 0.6}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="${r * 0.25}"/>`
		).join('')}
	</g>
	${SHADING}
</g>`;

// land, then the clouds swirling over it
const ocean = () => `<g id="planet-body-2">
	<circle r="1" fill="url(#planet-base-2)"/>
	<g clip-path="url(#planet-disc)">
		<path d="M -0.55 -0.7 C -0.2 -0.75 0 -0.45 -0.15 -0.2 C -0.3 0 -0.7 -0.1 -0.85 -0.3 Z" fill="${P[2].land}" fill-opacity="0.6"/>
		<path d="M 0.25 0.15 C 0.6 0 0.95 0.2 0.85 0.55 C 0.7 0.85 0.3 0.7 0.25 0.15 Z" fill="${P[2].land}" fill-opacity="0.6"/>
		<g fill="none" stroke="${P[2].cloud}" stroke-opacity="0.6" stroke-linecap="round">
			<path d="M -1 0.25 C -0.5 0.05 0 0.35 0.45 -0.05 S 0.95 -0.4 1.1 -0.2" stroke-width="0.09"/>
			<path d="M -0.9 0.55 C -0.4 0.4 -0.05 0.75 0.4 0.55" stroke-width="0.06"/>
			<path d="M 0.05 -0.55 C 0.3 -0.75 0.65 -0.6 0.55 -0.35 C 0.45 -0.15 0.2 -0.3 0.3 -0.45" stroke-width="0.07"/>
			<path d="M -0.75 -0.15 C -0.45 -0.35 -0.15 -0.05 -0.35 0.05" stroke-width="0.05"/>
		</g>
	</g>
	${SHADING}
</g>`;

// belts and zones, and a storm
const BANDS = [
	[-0.72, 0.14, 'light', 0.24],
	[-0.42, 0.2, 'band', 0.32],
	[-0.12, 0.12, 'light', 0.26],
	[0.08, 0.24, 'band', 0.34],
	[0.42, 0.1, 'light', 0.22],
	[0.62, 0.16, 'band', 0.3]
];

const giant = () => `<g id="planet-body-3">
	<circle r="1" fill="url(#planet-base-3)"/>
	<g clip-path="url(#planet-disc)" transform="rotate(-14)">
		${BANDS.map(([y, h, kind, o]) => `<rect x="-1.2" y="${y}" width="2.4" height="${h}" fill="${P[3][kind]}" fill-opacity="${o}"/>`).join('')}
		<ellipse cx="0.3" cy="0.2" rx="0.24" ry="0.11" fill="${P[3].storm}" fill-opacity="0.6"/>
		<ellipse cx="0.3" cy="0.2" rx="0.13" ry="0.05" fill="${P[3].eye}" fill-opacity="0.55"/>
	</g>
	${SHADING}
</g>`;

// what goes in a <defs>: the shared clip and gradients, each planet without its limb as planet-body-N, and with the
// game's as planet-vector-N
export const PLANET_DEFS = `<clipPath id="planet-disc"><circle r="1"/></clipPath>
${[1, 2, 3].map(base).join('')}
<radialGradient id="planet-night" cx="0.34" cy="0.3" r="0.95">
	<stop offset="0.45" stop-color="#000" stop-opacity="0"/>
	<stop offset="0.8" stop-color="#000" stop-opacity="0.35"/>
	<stop offset="1" stop-color="#000" stop-opacity="0.7"/>
</radialGradient>
<radialGradient id="planet-glint" cx="0.32" cy="0.28" r="0.3">
	<stop offset="0" stop-color="#fff" stop-opacity="0.45"/>
	<stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
${moon()}
${ocean()}
${giant()}
${[1, 2, 3].map((i) => `<g id="planet-vector-${i}"><use href="#planet-body-${i}"/>${limb(LIMB_W[i])}</g>`).join('')}`;

// one planet as a picture on its own, px across, filling it; limbWidth: its edge's, in radii, if not the game's
export const planetSvg = (i, px, limbWidth = LIMB_W[i]) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="-1 -1 2 2"><defs>${PLANET_DEFS}</defs><use href="#planet-body-${i}"/>${limb(limbWidth)}</svg>`;

// the same as a data: URL, for an <img>, an SVG <image> or a canvas
export const planetUrl = (i, px, limbWidth) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(planetSvg(i, px, limbWidth));
