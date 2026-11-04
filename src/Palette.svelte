<script>
	import { NAMES, R } from './const';
	import Planet from './Planet.svelte';
	import { mark, selMark } from './shared.svelte';

	// Up while a cell is selected: a planet of one of the sizes for it, or Clear. The cell's own planet is lit and
	// can't be picked again, and Clear can't be picked for a blank cell: neither would change anything.
	const SWATCHES = [1, 2, 3, 0];

	const current = $derived(selMark());
	const idle = (v) => (v ? v === current : current < 1);
</script>

<div class="palette" role="group" aria-label="Mark the cell">
	{#each SWATCHES as v (v)}
		<button class="swatch" class:picked={v && v === current} disabled={idle(v)} aria-label={NAMES[v]} onclick={() => mark(v)}>
			<svg viewBox="-50 -50 100 100">
				<circle r="46" class="ring" />
				{#if v}
					<Planet x={0} y={0} r={R[v]} size={v} />
				{:else}
					<path d="M-14 -14 L 14 14 M 14 -14 L -14 14" class="cross" />
				{/if}
			</svg>
			<span>{NAMES[v]}</span>
		</button>
	{/each}
</div>

<style>
	.palette {
		display: grid;
		grid-auto-flow: column;
		justify-content: center;
		gap: 12px;
	}

	.swatch {
		display: grid;
		justify-items: center;
		gap: 2px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		color: #b8b0ff;
		font-family: SM;
		font-size: 10px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 0.1s,
			opacity 0.2s;
	}

	.swatch:active {
		transform: scale(0.9);
	}

	.swatch:disabled {
		cursor: default;
		transform: none;
	}

	/* Clear for a blank cell */
	.swatch:disabled:not(.picked) {
		opacity: 0.3;
	}

	.swatch svg {
		width: 62px;
		height: 62px;
		overflow: visible;
	}

	.ring {
		fill: #ffffff08;
		stroke: #8f86ff;
		stroke-opacity: 0.3;
		stroke-width: 1.5;
		transition:
			stroke 0.2s,
			stroke-opacity 0.2s,
			fill 0.2s;
	}

	.swatch:not(:disabled):hover .ring {
		stroke-opacity: 0.7;
	}

	/* the cell's own planet */
	.picked {
		color: #ffd77a;
	}

	.picked .ring {
		fill: #ffd77a14;
		stroke: #ffd77a;
		stroke-opacity: 1;
		stroke-width: 2.5;
		filter: drop-shadow(0 0 6px #ffd77a);
	}

	.cross {
		stroke: #d8d2ff;
		stroke-width: 5;
		stroke-linecap: round;
	}
</style>
