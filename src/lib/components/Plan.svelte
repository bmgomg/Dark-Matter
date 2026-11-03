<script lang="ts">
	import type { Game } from '$lib/game/game.svelte';
	import { NAMES } from '$lib/game/game.svelte';
	import type { Size } from '$lib/game/logic';
	import Sphere from './Sphere.svelte';
	import Cross from './Cross.svelte';

	let { game }: { game: Game } = $props();

	const N = $derived(game.sol.length);
	const shown = $derived(game.phase === 'revealed' ? game.sol : game.marks);
	const locked = $derived(game.phase !== 'play');
</script>

<!-- keyed per puzzle so resetting the angle doesn't spin the new board back round -->
{#key game.id}
	<div
		class="plan"
		class:locked
		style:--n={N}
		style:transform="rotate({game.angle}deg)"
		role="grid"
		aria-label="Your map of the board"
	>
		{#each shown as row, i (i)}
			<div class="row" role="row">
				{#each row as v, j (j)}
					<button
						class="cell"
						class:wrong={game.isWrong(i, j)}
						role="gridcell"
						aria-label="Row {i + 1}, column {j + 1}: {v === -1 ? 'blank' : NAMES[v]}"
						aria-disabled={locked}
						onclick={() => game.paint(i, j)}
					>
						<svg viewBox="0 0 100 100" aria-hidden="true">
							<rect x="3" y="3" width="94" height="94" rx="8" />
							{#if v > 0}
								<Sphere cx={50} cy={50} size={v as Size} />
							{:else if v === 0 && game.phase !== 'revealed'}
								<Cross />
							{/if}
						</svg>
					</button>
				{/each}
			</div>
		{/each}
	</div>
{/key}

<style>
	/* 4 units of margin around N×100 units, matching the elevation's viewBox so lanes line up */
	.plan {
		--pad: calc(100% * 4 / (var(--n) * 100 + 8));
		padding: var(--pad);
		aspect-ratio: 1;
		display: grid;
		transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.2, 1);
	}
	.row {
		display: flex;
	}
	.cell {
		flex: 1;
		display: block;
		padding: 0;
		border: 0;
		min-height: 0;
		background: none;
		border-radius: 0;
		cursor: pointer;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
	.cell svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	rect {
		fill: var(--cell);
		stroke: var(--rule);
		stroke-width: 2;
		transition: fill 0.12s;
	}
	.cell:hover rect {
		fill: color-mix(in srgb, var(--cell) 70%, var(--accent));
	}
	.cell:focus-visible {
		outline: none;
	}
	.cell:focus-visible rect {
		stroke: var(--accent);
		stroke-width: 6;
	}
	.cell.wrong rect {
		stroke: var(--bad);
		stroke-width: 7;
	}
	.locked .cell {
		cursor: default;
	}
	.locked .cell:hover rect {
		fill: var(--cell);
	}
	@media (prefers-reduced-motion: reduce) {
		.plan {
			transition: none;
		}
	}
</style>
