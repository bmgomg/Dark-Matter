<script>
	import NumberFlow from '@number-flow/svelte';
	import { SIDES } from './const';
	import { avgScore, level, sideAt, ss } from './shared.svelte';

	// Scoring is still open: for now it counts quarter turns, and the stats are per level, in turns.
	// The level's stats, led by its difficulty (the board's size shows on the board): plays (given-up games count,
	// with a penalty), solved, avg and best. Best shows once a game is solved.
	const pzl = $derived(ss.pzl);
	const side = $derived(sideAt(ss.angle));
	const turns = $derived(pzl?.turns ?? 0);
	const fmt = (v, shown) => (shown ? (Math.round(v * 10) / 10).toString() : '–');
</script>

<div class="scoreboard">
	<div class="stats">
		<span class="label level">{level()?.sub}</span>
		<div class="stat"><span class="label">plays</span><span class="value"><NumberFlow value={ss.stats.plays} /></span></div>
		<div class="stat"><span class="label">solved</span><span class="value"><NumberFlow value={ss.stats.solved} /></span></div>
		<div class="stat"><span class="label">avg</span><span class="value">{fmt(avgScore(), ss.stats.plays)}</span></div>
		<div class="stat"><span class="label">best</span><span class="value">{fmt(ss.stats.best, ss.stats.solved)}</span></div>
	</div>

	<div class="turns">
		<span class="big"><NumberFlow value={turns} /></span>
		<span class="label">{turns === 1 ? 'turn' : 'turns'}</span>
	</div>
	<span class="sr">From the {SIDES[side]}</span>
</div>

<style>
	.scoreboard {
		display: grid;
		gap: 6px;
		justify-items: center;
		margin-top: 12px;
	}

	.stats {
		display: grid;
		grid-auto-flow: column;
		align-items: center;
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

	.level {
		color: #ffd77a;
	}

	.value {
		font-family: SM;
		font-size: 14px;
		color: #ece8ff;
	}

	/* the count with its word beside it, on one baseline */
	.turns {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.big {
		font-family: CZ;
		font-size: 36px;
		line-height: 1;
		color: #fff4dc;
		text-shadow: 0 0 12px #ffd77a55;
	}

	.turns .label {
		font-size: 12px;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
