<svelte:options namespace="svg" />

<script lang="ts" module>
	// radius by size, in a 100-unit cell — shared by the plan and the elevation so both read at one scale
	export const R = [0, 17, 29, 44];
</script>

<script lang="ts">
	import type { Size } from '$lib/game/logic';

	let { cx, cy, size }: { cx: number; cy: number; size: Size } = $props();
	const r = $derived(R[size]);
</script>

<circle {cx} {cy} {r} class="sph s{size}" />
<ellipse cx={cx - r * 0.34} cy={cy - r * 0.38} rx={r * 0.32} ry={r * 0.22} class="hl" />

<style>
	circle,
	ellipse {
		pointer-events: none;
	}
	.sph {
		stroke: var(--ink);
		stroke-width: 2.5;
	}
	.s1 {
		fill: var(--s);
	}
	.s2 {
		fill: var(--m);
	}
	.s3 {
		fill: var(--l);
	}
	.hl {
		fill: #fff;
		opacity: 0.38;
	}
</style>
