<script>
	import { onMount } from 'svelte';

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

	// a fine dark edge, in each planet's radii: about a pixel at the size it shows on the board and the tray
	const LIMB_W = { 1: 0.08, 2: 0.05, 3: 0.032 };
	const limb = (i) => ({ fill: 'none', stroke: '#05050f', 'stroke-opacity': 0.85, 'stroke-width': LIMB_W[i] });

	// Drawn as vectors, every gradient and clip was drawn again on each frame of a turn, which jittered (the designer saw
	// it, against the Recraft images). So once the page is up, each planet is drawn once into a bitmap, PX across, and
	// shown as an image from then on. Should that fail (a browser that won't draw an SVG into a canvas), the vectors stay.
	const PX = 256;
	let defs = $state();
	let images = $state();

	const toImage = async (i) => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${PX}" viewBox="-1 -1 2 2"><defs>${defs.innerHTML}</defs><use href="#planet-vector-${i}"/></svg>`;
		const img = new Image();
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
		await img.decode();
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = PX;
		canvas.getContext('2d').drawImage(img, 0, 0);
		const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png'));
		return URL.createObjectURL(blob);
	};

	onMount(() => {
		Promise.all([1, 2, 3].map(toImage))
			.then((urls) => (images = urls))
			.catch(() => {});
	});
</script>

<!-- The planets, each drawn on a unit circle (radius 1, centered on 0, 0) and used everywhere through <Planet>: 1 a golden
     cratered moon, 2 a teal ocean world under swirling clouds, 3 a violet banded gas giant. Lit from the upper left, like
     the whole sky, and outlined in the dark, so one in front of another stays apart from it. Each is drawn as vectors
     (planet-vector-N), then made a bitmap (planet-N, an image), as above. -->
<svg class="defs" aria-hidden="true">
	<defs bind:this={defs}>
		<clipPath id="planet-disc">
			<circle r="1" />
		</clipPath>

		{#each [1, 2, 3] as i (i)}
			<radialGradient id="planet-base-{i}" cx="0.36" cy="0.32" r="0.78">
				<stop offset="0" stop-color={P[i].lit} />
				<stop offset="0.55" stop-color={P[i].mid} />
				<stop offset="1" stop-color={P[i].dark} />
			</radialGradient>
		{/each}

		<!-- the night side, lower right, over every planet -->
		<radialGradient id="planet-night" cx="0.34" cy="0.3" r="0.95">
			<stop offset="0.45" stop-color="#000" stop-opacity="0" />
			<stop offset="0.8" stop-color="#000" stop-opacity="0.35" />
			<stop offset="1" stop-color="#000" stop-opacity="0.7" />
		</radialGradient>

		<!-- a glint on the lit side -->
		<radialGradient id="planet-glint" cx="0.32" cy="0.28" r="0.3">
			<stop offset="0" stop-color="#fff" stop-opacity="0.45" />
			<stop offset="1" stop-color="#fff" stop-opacity="0" />
		</radialGradient>

		<g id="planet-vector-1">
			<circle r="1" fill="url(#planet-base-1)" />
			<g clip-path="url(#planet-disc)">
				<!-- maria, and craters with a lit rim on the far side from the light -->
				<path d="M -0.9 0.1 C -0.6 -0.15 -0.25 0.05 -0.1 0.35 C 0 0.6 -0.4 0.8 -0.75 0.6 Z" fill={P[1].maria} fill-opacity="0.28" />
				<path d="M 0.15 -0.75 C 0.45 -0.8 0.7 -0.55 0.6 -0.3 C 0.45 -0.1 0.15 -0.3 0.15 -0.75 Z" fill={P[1].maria} fill-opacity="0.22" />
				{#each CRATERS as [x, y, r] (x)}
					<circle cx={x} cy={y} {r} fill={P[1].crater} fill-opacity="0.35" />
					<path
						d="M {x - r * 0.8} {y + r * 0.6} A {r} {r} 0 0 0 {x + r * 0.8} {y - r * 0.6}"
						fill="none"
						stroke="#fff"
						stroke-opacity="0.5"
						stroke-width={r * 0.25}
					/>
				{/each}
			</g>
			<circle r="1" fill="url(#planet-night)" />
			<circle r="1" fill="url(#planet-glint)" />
			<circle r="1" {...limb(1)} />
		</g>

		<g id="planet-vector-2">
			<circle r="1" fill="url(#planet-base-2)" />
			<g clip-path="url(#planet-disc)">
				<!-- land, then the clouds swirling over it -->
				<path d="M -0.55 -0.7 C -0.2 -0.75 0 -0.45 -0.15 -0.2 C -0.3 0 -0.7 -0.1 -0.85 -0.3 Z" fill={P[2].land} fill-opacity="0.6" />
				<path d="M 0.25 0.15 C 0.6 0 0.95 0.2 0.85 0.55 C 0.7 0.85 0.3 0.7 0.25 0.15 Z" fill={P[2].land} fill-opacity="0.6" />
				<g fill="none" stroke={P[2].cloud} stroke-opacity="0.6" stroke-linecap="round">
					<path d="M -1 0.25 C -0.5 0.05 0 0.35 0.45 -0.05 S 0.95 -0.4 1.1 -0.2" stroke-width="0.09" />
					<path d="M -0.9 0.55 C -0.4 0.4 -0.05 0.75 0.4 0.55" stroke-width="0.06" />
					<path d="M 0.05 -0.55 C 0.3 -0.75 0.65 -0.6 0.55 -0.35 C 0.45 -0.15 0.2 -0.3 0.3 -0.45" stroke-width="0.07" />
					<path d="M -0.75 -0.15 C -0.45 -0.35 -0.15 -0.05 -0.35 0.05" stroke-width="0.05" />
				</g>
			</g>
			<circle r="1" fill="url(#planet-night)" />
			<circle r="1" fill="url(#planet-glint)" />
			<circle r="1" {...limb(2)} />
		</g>

		<g id="planet-vector-3">
			<circle r="1" fill="url(#planet-base-3)" />
			<g clip-path="url(#planet-disc)" transform="rotate(-14)">
				<!-- belts and zones, and a storm -->
				<rect x="-1.2" y="-0.72" width="2.4" height="0.14" fill={P[3].light} fill-opacity="0.24" />
				<rect x="-1.2" y="-0.42" width="2.4" height="0.2" fill={P[3].band} fill-opacity="0.32" />
				<rect x="-1.2" y="-0.12" width="2.4" height="0.12" fill={P[3].light} fill-opacity="0.26" />
				<rect x="-1.2" y="0.08" width="2.4" height="0.24" fill={P[3].band} fill-opacity="0.34" />
				<rect x="-1.2" y="0.42" width="2.4" height="0.1" fill={P[3].light} fill-opacity="0.22" />
				<rect x="-1.2" y="0.62" width="2.4" height="0.16" fill={P[3].band} fill-opacity="0.3" />
				<ellipse cx="0.3" cy="0.2" rx="0.24" ry="0.11" fill={P[3].storm} fill-opacity="0.6" />
				<ellipse cx="0.3" cy="0.2" rx="0.13" ry="0.05" fill={P[3].eye} fill-opacity="0.55" />
			</g>
			<circle r="1" fill="url(#planet-night)" />
			<circle r="1" fill="url(#planet-glint)" />
			<circle r="1" {...limb(3)} />
		</g>

		{#each [1, 2, 3] as i (i)}
			{#if images}
				<image id="planet-{i}" href={images[i - 1]} x="-1" y="-1" width="2" height="2" />
			{:else}
				<use id="planet-{i}" href="#planet-vector-{i}" />
			{/if}
		{/each}
	</defs>
</svg>

<style>
	.defs {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}
</style>
