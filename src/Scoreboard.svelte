<script>
	import NumberFlow from '@number-flow/svelte';
	import { SIDES } from './const';
	import { avgScore, level, sideAt, ss } from './shared.svelte';

	// Scoring is still open: for now it counts quarter turns, and the stats are per level, in turns.
	const pzl = $derived(ss.pzl);
	const side = $derived(sideAt(ss.angle));
	const seen = $derived(pzl ? pzl.seen.filter(Boolean).length : 0);

	// the compass, with north up as on the board's letters
	const POINTS = [
		[0, 13],
		[13, 0],
		[0, -13],
		[-13, 0]
	];
	const fmt = (v) => (ss.stats.plays ? (Math.round(v * 10) / 10).toString() : '–');
</script>

<div class="scoreboard">
	<div class="stats">
		<div class="stat"><span class="label">solved</span><span class="value"><NumberFlow value={ss.stats.plays} /></span></div>
		<div class="stat"><span class="label">avg</span><span class="value">{fmt(avgScore())}</span></div>
		<div class="stat"><span class="label">best</span><span class="value">{fmt(ss.stats.best)}</span></div>
	</div>

	<div class="now">
		<div class="level">
			<span class="big">{level()?.label}</span>
			<span class="label">{level()?.sub}</span>
		</div>

		<div class="turns">
			<span class="big"><NumberFlow value={pzl?.turns ?? 0} /></span>
			<span class="label">turns</span>
		</div>

		<div class="sides">
			<svg viewBox="-20 -20 40 40" aria-label="{seen} of 4 sides seen">
				<circle r="13" class="orbit" />
				{#each POINTS as [x, y], k (k)}
					<circle cx={x} cy={y} r={k === side ? 4.2 : 3.2} class="pt" class:seen={pzl?.seen[k]} class:now={k === side} />
				{/each}
			</svg>
			<span class="label">{seen}/4 sides</span>
		</div>
	</div>
	<span class="sr">From the {SIDES[side]}</span>
</div>

<style>
	.scoreboard {
		display: grid;
		gap: 4px;
		justify-items: center;
		margin-top: 12px;
	}

	.stats {
		display: grid;
		grid-auto-flow: column;
		gap: 26px;
	}

	.stat {
		display: grid;
		grid-auto-flow: column;
		align-items: center;
		gap: 8px;
	}

	.label {
		font-family: SM;
		font-size: 10px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #b8b0ff;
	}

	.value {
		font-family: SM;
		font-size: 14px;
		color: #ece8ff;
	}

	.now {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		width: 380px;
	}

	.level,
	.turns,
	.sides {
		display: grid;
		justify-items: center;
		gap: 1px;
	}

	.level {
		justify-self: start;
		min-width: 90px;
	}

	.sides {
		justify-self: end;
		min-width: 90px;
	}

	.big {
		font-family: CZ;
		font-size: 28px;
		line-height: 1;
		color: #fff4dc;
		text-shadow: 0 0 12px #ffd77a55;
	}

	.turns .big {
		font-size: 36px;
	}

	.sides svg {
		width: 34px;
		height: 34px;
	}

	.orbit {
		fill: none;
		stroke: #8f86ff;
		stroke-opacity: 0.35;
		stroke-dasharray: 2 3;
	}

	.pt {
		fill: #2c2a6b;
		stroke: #8f86ff;
		stroke-width: 1;
		transition: fill 0.3s;
	}

	.pt.seen {
		fill: #b8b0ff;
	}

	.pt.now {
		fill: #ffd77a;
		stroke: #fff4dc;
		filter: drop-shadow(0 0 3px #ffd77a);
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
