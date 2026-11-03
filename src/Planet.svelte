<svelte:options namespace="svg" />

<script>
	// one of the planets in Defs, centered on x, y with radius r
	const { x, y, r, size, style = '', klass = '' } = $props();
</script>

<use href="#planet-{size}" class="planet {klass}" transform="translate({x} {y}) scale({r})" {style} />

<style>
	.planet {
		pointer-events: none;
	}
</style>
