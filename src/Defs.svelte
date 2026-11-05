<script>
	import moon from '$lib/images/planet-1.webp';
	import ocean from '$lib/images/planet-2.webp';
	import giant from '$lib/images/planet-3.webp';

	const IMAGES = [moon, ocean, giant];
</script>

<!-- The planets, each one image on a unit circle (radius 1, centered on 0, 0) and used everywhere through <Planet>:
     1 a golden world, 2 an ocean world, 3 a gas giant. Lit from the upper left, like the whole sky. Each image is the
     disc alone, stretched to a true circle, 256 px across: enough for the largest one on a phone. -->
<svelte:head>
	{#each IMAGES as href (href)}
		<link rel="preload" as="image" {href} />
	{/each}
</svelte:head>

<svg class="defs" aria-hidden="true">
	<defs>
		{#each IMAGES as href, i (href)}
			<image id="planet-{i + 1}" {href} x="-1" y="-1" width="2" height="2" />
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
