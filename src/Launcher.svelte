<script>
	import { fade } from 'svelte/transition';
	import { BANK, COST_CHANGE, COST_TURN, DIFF_NAMES, LEVELS } from './const';
	import Countdown from './Countdown.svelte';
	import { costOf, dateOf, money, shareCard } from './logic';
	import { begun, dailyGame, inProgress, onPlay, persistCommon, ss, today } from './shared.svelte';
	import TextButton from './Text Button.svelte';
	import { copyText, post } from './utils';

	// Between Home and a game, as in Triangula: how the bank works, then the board's size and the difficulty, then
	// Start, or Resume for a level with a game under way. It opens on the level picked last. For the daily, in place of
	// all that: today's date, a button for each level's puzzle, saying how that one stands, Share once one is finished,
	// and the time till the next.
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
	const PICKED = 'background: hsl(var(--mono) 98%); color: hsl(var(--mono) 12%); font-weight: 700;';
	// the daily's: as wide as their names, as above, with room for a second line, one or two lines keeping the row level
	const DAILY_OP = 'height: 56px; padding: 0 15px; align-content: center; font-size: 13px; letter-spacing: 0.1em;';
	// wide enough for what it says after a press, so it holds still
	const SHARE = 'width: 130px; padding: 10px 0 9px;' + OP;
	const SHARED_MS = 1500;

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
			return money(BANK - costOf(game));
		}

		return game?.over ? 'gave up' : game && begun(game) ? 'resume' : '';
	};

	const finished = $derived(dailies.flatMap(({ levels }) => levels).filter((l) => l.game?.over));

	// what Share says for a moment after a press
	let shared = $state('');
	let sharedTimer = null;
	let pressed = false;

	const share = async () => {
		const copied = await copyText(shareCard(date, finished));

		shared = copied ? 'copied' : 'copy failed';
		clearTimeout(sharedTimer);
		sharedTimer = post(() => (shared = ''), SHARED_MS);
	};

	// the copy goes with the click, the one moment every browser allows it, and onClick makes up for a press with no click
	const onSharePress = () => {
		pressed = true;
		share();
	};

	const onShareClick = () => {
		if (!pressed) {
			share();
		}

		pressed = false;
	};

	const play = (level) => {
		delete ss.launcher;
		onPlay(level);
	};
</script>

<div class="launcher">
	<p class="economy">
		You start with <em>${BANK}</em>. Each turn of the board costs <em>${COST_TURN}</em>. Placing a planet is free, but changing your mind is
		not: that costs <em>${COST_CHANGE}</em> too. Finish in the black — or shift into the red trying.
	</p>

	{#if ss.daily}
		<div class="label">{date}</div>

		<div class="dailies">
			{#each dailies as { label, levels } (label)}
				<div class="pick">
					<div class="label size">{label}</div>
					<div class="levels">
						{#each levels as l (l.id)}
							<div class="level" class:scored={l.game?.over === 'won'} class:finished={l.game?.over}>
								<TextButton text={[l.sub, standing(l.game)].filter(Boolean)} framed style={DAILY_OP} onClick={() => play(l.id)} />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		{#if finished.length}
			<TextButton text={[shared || 'share']} framed style={SHARE} onPress={onSharePress} onClick={onShareClick} />
		{/if}

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

		<!-- the pill holds still while its word changes -->
		<TextButton framed style="width: 150px; padding: 13px 0; font-size: 16px; letter-spacing: 0.3em; margin-top: 15px;" onClick={() => play(id)}>
			{#key resume}
				<div class="word" transition:fade={{ duration: 200 }}>{resume ? 'resume' : 'start'}</div>
			{/key}
		</TextButton>
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
		background: hsl(var(--mono) 8% / 0.63);
		border: 1px solid hsl(var(--mono) 72% / 0.2);
		box-shadow: 0 0 40px hsl(var(--mono) 62% / 0.13);
	}

	.economy {
		margin: 0;
		font-family: SI;
		font-size: 20px;
		line-height: 1.45;
		text-align: justify;
		color: hsl(var(--mono) 90%);
	}

	.economy em {
		font-style: normal;
		color: hsl(var(--mono) 98%);
	}

	.pick {
		display: grid;
		justify-items: center;
		gap: 12px;
	}

	/* Start and Resume, one over the other as they cross */
	.word {
		grid-area: 1 / 1;
	}

	.label {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: hsl(var(--mono) 76%);
	}

	.ops {
		display: grid;
		grid-auto-flow: column;
		gap: 14px;
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

	/* finished, solved or given up: dimmer, for the day's progress to show at a glance; a hover or the keyboard's focus
	   still fills it, as on any pill */
	.finished :global(.framed:not(:hover, :focus-visible)) {
		border-color: hsl(var(--mono) 76%);
		background: hsl(var(--mono) 76% / 0.15);
		color: hsl(var(--mono) 90%);
		box-shadow:
			0 0 14px hsl(var(--mono) 76% / 0.2),
			inset 0 0 10px hsl(var(--mono) 76% / 0.1);
	}

	.scored :global(.button > div + div) {
		font-size: 18px;
		line-height: 1.15;
		letter-spacing: 0.04em;
	}
</style>
