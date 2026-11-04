<script>
	import NumberFlow from '@number-flow/svelte';
	import { BANK, SIDES } from './const';
	import Money from './Money.svelte';
	import { avgScore, balance, cost, level, sideAt, ss } from './shared.svelte';

	// The level's stats, led by its difficulty (the board's size shows on the board): plays (given-up games count, at
	// $0 or less), solved, and the average and best balance (the best shows once a game is solved). Below them, the
	// game's budget: the bank, less what turning and changing your mind have cost, leaves the balance.
	const side = $derived(sideAt(ss.angle));
	const left = $derived(balance());
	const money = (v, shown) => (shown ? `${v < 0 ? '−' : ''}$${Math.round(Math.abs(v) * 10) / 10}` : '–');
</script>

<div class="scoreboard">
	<div class="stats">
		<span class="label level">{level()?.sub}</span>
		<div class="stat"><span class="label">plays</span><span class="value"><NumberFlow value={ss.stats.plays} /></span></div>
		<div class="stat"><span class="label">solved</span><span class="value"><NumberFlow value={ss.stats.solved} /></span></div>
		<div class="stat"><span class="label">avg</span><span class="value">{money(avgScore(), ss.stats.plays)}</span></div>
		<div class="stat"><span class="label">best</span><span class="value">{money(ss.stats.best, ss.stats.solved)}</span></div>
	</div>

	<!-- in columns, top to bottom: each label over its sum, the signs level with the sums -->
	<div class="budget">
		<span class="label">bank</span>
		<span class="sum"><Money value={BANK} /></span>
		<span></span>
		<span class="sign">−</span>
		<span class="label">cost</span>
		<span class="sum"><Money value={cost()} /></span>
		<span></span>
		<span class="sign">=</span>
		<span class="label">balance</span>
		<span class="sum balance" class:broke={left < 0}><Money value={left} trend={-1} /></span>
	</div>
	<span class="sr">From the {SIDES[side]}</span>
</div>

<style>
	.scoreboard {
		display: grid;
		gap: 10px;
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

	/* bank − cost = balance, each sum under its label */
	.budget {
		display: grid;
		grid-template-rows: auto auto;
		grid-template-columns: minmax(64px, auto) 20px minmax(64px, auto) 20px minmax(64px, auto);
		grid-auto-flow: column;
		place-items: center;
		column-gap: 8px;
		row-gap: 2px;
	}

	.sum {
		font-family: CZ;
		font-size: 30px;
		line-height: 1;
		color: #d8d2ff;
		opacity: 0.75;
	}

	.balance {
		color: #fff4dc;
		opacity: 1;
		text-shadow: 0 0 12px #ffd77a55;
	}

	.broke {
		color: #ff8a98;
		text-shadow: 0 0 12px #ff6b7d55;
	}

	.sign {
		font-family: QS;
		font-size: 26px;
		line-height: 1;
		color: #b8b0ff;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
