<script>
	import { BANK, COST_CHANGE, COST_TURN, DIFF_NAMES, LEVELS } from './const';
	import Countdown from './Countdown.svelte';
	import { dateOf } from './logic';
	import { begun, costOf, dailyGame, inProgress, onPlay, persistCommon, ss, today } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	// Between Home and a game, as in Triangula: how the bank works, then the board's size and the difficulty, then
	// Start, or Resume for a level with a game under way. It opens on the level picked last. For the daily, in place of
	// all that: today's date, a button for each level's puzzle, saying how that one stands, and the time till the next.
	const SIZES = [4, 5];
	const DIFFS = ['easy', 'hard', 'expert'];

	// the level picked, kept with the sound settings so it's still there next time; a daily played doesn't change it
	const picked = $derived(LEVELS.find((l) => l.id === ss.picked) ?? LEVELS[0]);
	const N = $derived(picked.N);
	const diff = $derived(picked.diff);
	const id = $derived(picked.id);

	const pick = (n, d) => {
		ss.picked = LEVELS.find((l) => l.N === n && l.diff === d).id;
		persistCommon();
	};

	const OP = 'font-size: 14px; letter-spacing: 0.1em;';
	const BOARD = 'width: 130px; padding: 10px 0 9px;';
	// three names of different lengths: each pill as wide as its name
	const DIFFICULTY = 'padding: 10px 12px 9px;';
	const PICKED = 'background: #ffd77a; color: #14102e; font-weight: 700;';
	// the daily's: as wide as their names, as above, with room for a second line, one or two lines keeping the row level
	const DAILY_OP = 'height: 56px; padding: 0 15px; align-content: center; font-size: 13px; letter-spacing: 0.1em;';

	const resume = $derived(inProgress(id));

	const day = $derived(today());
	const date = $derived(dateOf(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

	// (the saves are read when the launcher comes up, which is after any game, or when the day changes)
	const dailies = $derived(
		SIZES.map((n) => ({
			label: `${n}×${n}`,
			levels: LEVELS.filter((l) => l.N === n).map((l) => ({ ...l, game: dailyGame(l.id, day) }))
		}))
	);

	// a level's daily so far: nothing new to say, resume, what it scored, or that it was given up
	const standing = (game) => {
		if (game?.over === 'won') {
			const score = BANK - costOf(game);
			return `${score < 0 ? '−' : ''}$${Math.abs(score)}`;
		}

		return game?.over ? 'gave up' : game && begun(game) ? 'resume' : '';
	};

	// gold is the last selection, as in Binge; a solved one is lavender (.solved), and one given up is faded
	const dailyStyle = (l) => DAILY_OP + (l.id === ss.pickedDaily ? PICKED : l.game?.over === 'revealed' ? 'opacity: 0.6;' : '');

	const playDaily = (id) => {
		ss.pickedDaily = id;
		persistCommon();
		play(id);
	};

	const play = (level) => {
		delete ss.launcher;
		onPlay(level);
	};
</script>

<div class="launcher">
	<p class="economy">
		You start with <em>${BANK}</em>. Each turn of the board costs <em>${COST_TURN}</em>. Placing a planet is free, but changing your mind is
		not: that costs <em>${COST_CHANGE}</em> too. Finish in the black — or break the bank trying.
	</p>

	{#if ss.daily}
		<div class="pick">
			<div class="label">{date}</div>
			<div class="note">Six new puzzles a day, the same for everyone. One try at each.</div>
		</div>

		<div class="dailies">
			{#each dailies as { label, levels } (label)}
				<div class="pick">
					<div class="label size">{label}</div>
					<div class="levels">
						{#each levels as l (l.id)}
							<div class="level" class:scored={l.game?.over === 'won'} class:solved={l.game?.over === 'won' && l.id !== ss.pickedDaily}>
								<TextButton text={[l.sub, standing(l.game)].filter(Boolean)} framed style={dailyStyle(l)} onClick={() => playDaily(l.id)} />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<Countdown />
	{:else}
		<div class="pick">
			<div class="label">board</div>
			<div class="ops" role="radiogroup" aria-label="Board">
				{#each SIZES as n (n)}
					<TextButton text={[`${n}×${n}`]} framed style={BOARD + OP + (n === N ? PICKED : '')} onClick={() => pick(n, diff)} />
				{/each}
			</div>
		</div>

		<div class="pick">
			<div class="label">difficulty</div>
			<div class="ops" role="radiogroup" aria-label="Difficulty">
				{#each DIFFS as d (d)}
					<TextButton text={[DIFF_NAMES[d]]} framed style={DIFFICULTY + OP + (d === diff ? PICKED : '')} onClick={() => pick(N, d)} />
				{/each}
			</div>
		</div>

		<TextButton
			text={[resume ? 'resume' : 'start']}
			framed
			style="width: 150px; padding: 13px 0; font-size: 16px; letter-spacing: 0.3em; margin-top: 15px;"
			onClick={() => play(id)}
		/>
	{/if}
</div>

<style>
	/* its one column stays the panel's width, whatever is in it: the daily's rows can run a little wider, centred */
	.launcher {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
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

	.note {
		font-family: SI;
		font-size: 18px;
		text-align: center;
		text-wrap: balance;
		color: #d8d2ff;
	}

	/* the board's size over its row */
	.size {
		font-size: 15px;
		letter-spacing: 0.15em;
	}

	.dailies {
		display: grid;
		gap: 18px;
		width: max-content;
	}

	/* each pill as wide as what it says */
	.levels {
		display: grid;
		grid-auto-flow: column;
		gap: 10px;
	}

	.level {
		display: grid;
	}

	/* how that level's daily stands, under its name; a score, most of all */
	.levels :global(.button > div + div) {
		font-size: 14px;
		letter-spacing: 0.06em;
	}

	/* solved: lavender, for the day's progress to show at a glance, apart from the gold of the last selection; a hover or
	   the keyboard's focus still turns it gold, as on any pill */
	.solved :global(.framed:not(:hover, :focus-visible)) {
		border-color: #b8b0ff;
		background: #b8b0ff26;
		color: #ece8ff;
		box-shadow:
			0 0 14px #b8b0ff33,
			inset 0 0 10px #b8b0ff1a;
	}

	.scored :global(.button > div + div) {
		font-size: 18px;
		line-height: 1.15;
		letter-spacing: 0.04em;
	}
</style>
