<script lang="ts">
	import { elevation, type Grid } from '$lib/game/logic';
	import { NAMES } from '$lib/game/game.svelte';
	import Sphere, { R } from './Sphere.svelte';

	let { sol, side, key }: { sol: Grid; side: number; key: string } = $props();

	const H = 104;
	const N = $derived(sol.length);
	const lanes = $derived(elevation(sol, side));
	const label = $derived(
		'Side view, left to right. ' +
			lanes
				.map((l, c) => `Lane ${c + 1}: ${l.length ? l.map((v) => NAMES[v]).join(', then ') : 'empty'}.`)
				.join(' ')
	);
</script>

<svg viewBox="-4 0 {N * 100 + 8} {H + 8}" role="img" aria-label={label}>
	{#each { length: N - 1 }, c (c)}
		<line class="lane" x1={(c + 1) * 100} y1="6" x2={(c + 1) * 100} y2={H} />
	{/each}
	{#key key}
		<g class="rise">
			{#each lanes as visible, c (c)}
				<!-- back to front, so nearer spheres overlap the ones behind -->
				{#each visible.toReversed() as v, k (k)}
					<Sphere cx={c * 100 + 50} cy={H - R[v]} size={v} />
				{/each}
			{/each}
		</g>
	{/key}
	<line class="floor" x1="-4" y1={H + 1.5} x2={N * 100 + 4} y2={H + 1.5} />
</svg>

<style>
	svg {
		width: 100%;
		display: block;
	}
	.floor {
		stroke: var(--ink);
		stroke-width: 3;
	}
	.lane {
		stroke: var(--rule);
		stroke-width: 2;
		stroke-dasharray: 6 8;
	}
	.rise {
		animation: rise 0.28s ease-out;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rise {
			animation: none;
		}
	}
</style>
