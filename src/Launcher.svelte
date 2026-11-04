<script>
	import { BANK, COST_CHANGE, COST_TURN, LEVELS } from './const';
	import { level, onPlay, ss } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	// Between Home and a game, as in Triangula: how the bank works, then the board's size and the difficulty, then
	// Play. It opens on the level played last; Play goes on with that level's game if it isn't finished.
	const SIZES = [4, 5];
	const DIFFS = ['easy', 'hard'];

	let N = $state(level()?.N ?? 4);
	let diff = $state(level()?.diff ?? 'easy');

	const OP = 'width: 92px; padding: 10px 0 9px; font-size: 14px; letter-spacing: 0.2em;';
	const PICKED = 'background: #ffd77a; color: #14102e;';

	const play = () => {
		const id = LEVELS.find((l) => l.N === N && l.diff === diff).id;
		delete ss.launcher;
		onPlay(id);
	};
</script>

<div class="launcher">
	<p class="economy">
		You start with <em>${BANK}</em>. Each turn of the board costs <em>${COST_TURN}</em>. Placing a planet is free, but changing your mind is
		not: that costs <em>${COST_CHANGE}</em> too. Finish in the black.
	</p>

	<div class="pick">
		<div class="label">board</div>
		<div class="ops" role="radiogroup" aria-label="Board">
			{#each SIZES as n (n)}
				<TextButton text={[`${n}×${n}`]} framed style={OP + (n === N ? PICKED : '')} onClick={() => (N = n)} />
			{/each}
		</div>
	</div>

	<div class="pick">
		<div class="label">difficulty</div>
		<div class="ops" role="radiogroup" aria-label="Difficulty">
			{#each DIFFS as d (d)}
				<TextButton text={[d]} framed style={OP + (d === diff ? PICKED : '')} onClick={() => (diff = d)} />
			{/each}
		</div>
	</div>

	<TextButton text={['play']} framed style="width: 150px; padding: 13px 0; font-size: 16px; letter-spacing: 0.3em;" onClick={play} />
</div>

<style>
	.launcher {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 34px;
		width: 370px;
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
		text-align: center;
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
