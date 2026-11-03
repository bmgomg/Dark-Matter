<script>
	import { NAMES, R } from './const';
	import Planet from './Planet.svelte';
	import { onDone, persistCommon, ss } from './shared.svelte';
	import { tap } from './sound.svelte';

	// what a tap on the board marks: a planet of one of the sizes, or an empty cell; then Done, at the end of the row
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

	<button class="brush done" aria-label="Done" disabled={!ss.pzl || ss.generating} onclick={onDone}>
		<svg viewBox="-50 -50 100 100">
			<circle r="46" class="ring" />
			<path d="M-18 1 L -5 14 L 19 -12" class="check" />
		</svg>
		<span>done</span>
	</button>
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

	.done {
		color: #ffd77a;
	}

	.done .ring {
		fill: #ffd77a1f;
		stroke: #ffd77a;
		stroke-opacity: 0.9;
		stroke-width: 2;
		filter: drop-shadow(0 0 8px #ffd77a66);
	}

	.done:hover .ring {
		fill: #ffd77a3d;
	}

	.done:disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	.check {
		fill: none;
		stroke: #ffd77a;
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
