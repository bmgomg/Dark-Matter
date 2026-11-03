<script>
	import { R, SIDES } from './const';
	import { elevation } from './logic';
	import Planet from './Planet.svelte';
	import { ss, turnBy } from './shared.svelte';
	import { NEAR, sideAt } from './view3d';

	// The view from the player's seat, edge-on: each lane shows the planets that peek over the ones in front.
	// While the board turns, the planets sink below the edge and the next side's rise in their place.

	const H = 124;
	const GROUND = 104;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const lane = $derived(NEAR / N);
	const side = $derived(sideAt(ss.angle));

	// 0 at rest on a side, 1 halfway between two
	const between = $derived(Math.abs(ss.angle / 90 - Math.round(ss.angle / 90)) * 2);
	const sink = $derived(Math.max(ss.rise, between * between * (3 - 2 * between)));

	const planets = $derived.by(() => {
		const out = [];

		elevation(pzl.sol, side).forEach((visible, c) => {
			const x = -NEAR / 2 + (c + 0.5) * lane;

			// back to front, so the nearer ones are drawn over the ones they stand before
			for (let k = visible.length - 1; k >= 0; k--) {
				const v = visible[k];
				const r = (R[v] / 100) * lane;
				out.push({ id: `${c}-${k}`, x, r, v, y: GROUND - r + sink * (2 * r + 10) });
			}
		});

		return out;
	});
</script>

<div class="horizon">
	<svg viewBox="-225 0 450 {H}" role="img" aria-label="The board from the {SIDES[side]}, edge-on">
		<defs>
			<radialGradient id="dawn" cx="0.5" cy="1" r="0.5">
				<stop offset="0" stop-color="#ffcf7a" stop-opacity="0.3" />
				<stop offset="0.6" stop-color="#ff9f6a" stop-opacity="0.1" />
				<stop offset="1" stop-color="#b06bff" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#ffd77a" stop-opacity="0" />
				<stop offset="0.12" stop-color="#ffd77a" />
				<stop offset="0.88" stop-color="#ffd77a" />
				<stop offset="1" stop-color="#ffd77a" stop-opacity="0" />
			</linearGradient>
			<clipPath id="above">
				<rect x="-225" y="-40" width="450" height={GROUND + 40} />
			</clipPath>
		</defs>

		<ellipse cx="0" cy={GROUND} rx={NEAR / 2 + 40} ry="60" fill="url(#dawn)" clip-path="url(#above)" />

		{#each { length: N - 1 }, c (c)}
			{@const x = -NEAR / 2 + (c + 1) * lane}
			<line x1={x} y1="22" x2={x} y2={GROUND} class="lane" />
		{/each}

		<g clip-path="url(#above)">
			{#each planets as p (p.id)}
				<Planet x={p.x} y={p.y} r={p.r} size={p.v} />
			{/each}
		</g>

		<!-- the board's edge, as a 2D being would see it: a line -->
		<rect x={-NEAR / 2 - 14} y={GROUND} width={NEAR + 28} height="5" rx="2" fill="#4a3fae" />
		<rect x={-NEAR / 2 - 30} y={GROUND - 0.5} width={NEAR + 60} height="2" fill="url(#edge)" class="edge" />

		<text x="0" y="12" class="side-label">from the {SIDES[side]}</text>
	</svg>

	<button class="turn left" aria-label="Turn the board clockwise" onclick={() => turnBy(1)} disabled={!pzl}>
		<svg viewBox="0 0 40 40"><path d="M28 13 A 11 11 0 1 0 31 24" /><path d="M24 7 L 29 13 L 22 16" /></svg>
	</button>
	<button class="turn right" aria-label="Turn the board counterclockwise" onclick={() => turnBy(-1)} disabled={!pzl}>
		<svg viewBox="0 0 40 40"><path d="M12 13 A 11 11 0 1 1 9 24" /><path d="M16 7 L 11 13 L 18 16" /></svg>
	</button>
</div>

<style>
	.horizon {
		display: grid;
		width: 450px;
		height: 124px;
	}

	.horizon > svg {
		grid-area: 1/1;
		width: 450px;
		height: 124px;
		overflow: visible;
	}

	.lane {
		stroke: #8f86ff;
		stroke-opacity: 0.22;
		stroke-width: 1;
		stroke-dasharray: 2 6;
	}

	.edge {
		filter: drop-shadow(0 0 4px #ffd77a);
	}

	.side-label {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		fill: #ffd77a;
		text-anchor: middle;
		dominant-baseline: central;
	}

	.turn {
		grid-area: 1/1;
		align-self: end;
		width: 44px;
		height: 44px;
		margin-bottom: 26px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: #ffffff0d;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition:
			background 0.15s,
			transform 0.1s;
		-webkit-tap-highlight-color: transparent;
	}

	.turn:hover {
		background: #ffffff1f;
	}

	.turn:active {
		transform: scale(0.88);
	}

	.turn.left {
		justify-self: start;
		margin-left: 6px;
	}

	.turn.right {
		justify-self: end;
		margin-right: 6px;
	}

	.turn svg {
		width: 30px;
		height: 30px;
		fill: none;
		stroke: #d8d2ff;
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
