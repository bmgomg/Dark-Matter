<script>
	import { BANK, COST_CHANGE, COST_TURN, DIFF_NAMES, LEVELS } from './const';
	import { inProgress, level, onPlay, ss } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	// Between Home and a game, as in Triangula: how the bank works, then the board's size and the difficulty, then
	// Start, or Resume for a level with a game under way. It opens on the level played last.
	const SIZES = [4, 5];
	const DIFFS = ['easy', 'hard', 'expert'];

	let N = $state(level()?.N ?? 4);
	let diff = $state(level()?.diff ?? 'easy');

	const OP = 'font-size: 14px; letter-spacing: 0.1em;';
	const BOARD = 'width: 130px; padding: 10px 0 9px;';
	// three names of different lengths: each pill as wide as its name
	const DIFFICULTY = 'padding: 10px 12px 9px;';
	const PICKED = 'background: #ffd77a; color: #14102e; font-weight: 700;';

	const id = $derived(LEVELS.find((l) => l.N === N && l.diff === diff).id);
	const resume = $derived(inProgress(id));

	const play = () => {
		delete ss.launcher;
		onPlay(id);
	};
</script>

<div class="launcher">
	<p class="economy">
		You start with <em>${BANK}</em>. Each turn of the board costs <em>${COST_TURN}</em>. Placing a planet is free, but changing your mind is
		not: that costs <em>${COST_CHANGE}</em> too. Finish in the black — or break the bank trying.
	</p>

	<div class="pick">
		<div class="label">board</div>
		<div class="ops" role="radiogroup" aria-label="Board">
			{#each SIZES as n (n)}
				<TextButton text={[`${n}×${n}`]} framed style={BOARD + OP + (n === N ? PICKED : '')} onClick={() => (N = n)} />
			{/each}
		</div>
	</div>

	<div class="pick">
		<div class="label">difficulty</div>
		<div class="ops" role="radiogroup" aria-label="Difficulty">
			{#each DIFFS as d (d)}
				<TextButton text={[DIFF_NAMES[d]]} framed style={DIFFICULTY + OP + (d === diff ? PICKED : '')} onClick={() => (diff = d)} />
			{/each}
		</div>
	</div>

	<TextButton
		text={[resume ? 'resume' : 'start']}
		framed
		style="width: 150px; padding: 13px 0; font-size: 16px; letter-spacing: 0.3em; margin-top: 15px;"
		onClick={play}
	/>
</div>

<style>
	.launcher {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 34px;
		width: 380px;
		padding: 36px 30px 40px;
		box-sizing: border-box;
		border-radius: 24px;
		background: #0a0820a0;
		border: 1px solid #8f86ff33;
		box-shadow: 0 0 40px #b06bff22;
	}

	.economy {
		margin: 0;
		font-family: SI;
		font-size: 20px;
		line-height: 1.45;
		text-align: justify;
		color: #ece8ff;
	}

	.economy em {
		font-style: normal;
		color: #ffd77a;
	}

	.pick {
		display: grid;
		justify-items: center;
		gap: 12px;
	}

	.label {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #b8b0ff;
	}

	.ops {
		display: grid;
		grid-auto-flow: column;
		gap: 14px;
	}
</style>
