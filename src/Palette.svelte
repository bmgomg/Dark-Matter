<script>
	import { NAMES, R } from './const';
	import Planet from './Planet.svelte';
	import { persistCommon, ss } from './shared.svelte';
	import { tap } from './sound.svelte';

	// what a tap on the board marks: a planet of one of the sizes, or an empty cell. No Done: the game ends when the
	// map matches the sky.
	const BRUSHES = [1, 2, 3, 0];

	const pick = (v) => {
		if (ss.brush !== v) {
			tap();
			ss.brush = v;
			persistCommon();
		}
	};
</script>

<div class="palette">
	<div class="brushes" role="radiogroup" aria-label="Mark with">
		{#each BRUSHES as v (v)}
			<button
				class="brush"
				class:picked={ss.brush === v}
				role="radio"
				aria-checked={ss.brush === v}
				aria-label={NAMES[v]}
				onclick={() => pick(v)}
			>
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
</div>

<style>
	.palette {
		display: grid;
		grid-auto-flow: column;
		justify-content: center;
		gap: 26px;
	}

	.brushes {
		display: grid;
		grid-auto-flow: column;
		gap: 12px;
	}

	.brush {
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
		transition: transform 0.1s;
	}

	.brush:active {
		transform: scale(0.9);
	}

	.brush svg {
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

	.brush:hover .ring {
		stroke-opacity: 0.7;
	}

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
