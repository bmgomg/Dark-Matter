<script>
	import { onMount } from 'svelte';
	import { PLANET_DEFS, planetUrl } from './planets';

	// Drawn as vectors, every gradient and clip was drawn again on each frame of a turn, which jittered (the designer saw
	// it, against the Recraft images). So once the page is up, each planet is drawn once into a bitmap, PX across, and
	// shown as an image from then on. Should that fail (a browser that won't draw an SVG into a canvas), the vectors stay.
	const PX = 256;
	let images = $state();

	const toImage = async (i) => {
		const img = new Image();
		img.src = planetUrl(i, PX);
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

<!-- The planets (src/planets.js), used everywhere through <Planet>: each drawn as vectors (planet-vector-N), then made a
     bitmap (planet-N, an image), as above. -->
<svg class="defs" aria-hidden="true">
	<defs>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own markup, no input in it -->
		{@html PLANET_DEFS}

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
