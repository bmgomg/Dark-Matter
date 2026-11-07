<script>
	import { clearAllText, OVER_MS, STRIP_SLIDE_MS, PROMPT_CLEAR_ALL, PROMPT_PLAY_NEW, PROMPT_RESET_STATS, PROMPT_SURRENDER } from './const';
	import Countdown from './Countdown.svelte';
	import { clearAll, isOver, planetCount, playNew, resetStats, reveal, ss, today } from './shared.svelte';
	import TextButton from './Text Button.svelte';
	import { pushIn, pushOut, slideX } from './utils';

	// in the palette's place: the answers to a prompt, or, at the end of a game, its message for a while, then Play new;
	// in the daily, the time till the next puzzle, and Play new once that has come
	const PILL = 'font-size: 12px; letter-spacing: 0.06em; padding: 11px 18px;';

	// The game-over message stays for OVER_MS from the end. Worked out as the prompt comes, not by an effect after it, which
	// would show Play new for a moment first, pushing it in and straight back out; the timer only says when it's up.
	let spent = $state(0);

	const lingering = $derived(
		ss.prompt === PROMPT_PLAY_NEW && !!ss.overAt && ss.overAt !== spent && Date.now() - ss.overAt < OVER_MS
	);

	$effect(() => {
		if (lingering) {
			const { overAt } = ss;
			const id = setTimeout(() => (spent = overAt), OVER_MS - (Date.now() - overAt));
			return () => clearTimeout(id);
		}
	});

	// One pushes another, as the pages do: what comes next comes in from the right, the game-over message, Play new (or the
	// countdown) after it, a question, another question; only a question put away after a game (No, or Reset Stats done)
	// goes back to Play new, which comes back from the left, where it went.
	const kind = $derived(ss.prompt === PROMPT_PLAY_NEW ? (lingering ? 'over' : 'next') : 'question');
	let lastKind;

	const way = $derived.by(() => {
		const way = lastKind === 'question' && kind === 'next' ? -1 : 1;

		lastKind = kind;
		return way;
	});

	// (read from the start, so the first change knows where it came from)
	$effect(() => void way);

	// a prompt asked after the game ended goes back to Play new
	const dismiss = () => {
		delete ss.prompt;

		if (isOver()) {
			ss.prompt = PROMPT_PLAY_NEW;
		}
	};
</script>

<div class="actions">
	{#if ss.prompt === PROMPT_SURRENDER}
		<div class="pair" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>
			<TextButton text={[PROMPT_SURRENDER]} framed style={PILL} onClick={reveal} />
			<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
		</div>
	{:else if ss.prompt === PROMPT_CLEAR_ALL}
		<div class="pair" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>
			<TextButton
				text={[clearAllText(planetCount())]}
				framed
				style={PILL}
				onClick={() => {
					clearAll();
					dismiss();
				}}
			/>
			<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
		</div>
	{:else if ss.prompt === PROMPT_RESET_STATS}
		<div class="pair" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>
			<TextButton
				text={[PROMPT_RESET_STATS]}
				framed
				style={PILL}
				onClick={() => {
					resetStats();
					dismiss();
				}}
			/>
			<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
		</div>
	{:else if ss.prompt === PROMPT_PLAY_NEW && lingering}
		<div class="over" class:won={ss.pzl?.over === 'won'} in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>{ss.message}</div>
	{:else if ss.prompt === PROMPT_PLAY_NEW}
		<div in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>
			{#if ss.daily && ss.pzl?.day === today()}
				<Countdown />
			{:else}
				<TextButton text={['play new']} framed onClick={playNew} />
			{/if}
		</div>
	{/if}
</div>

<style>
	/* as tall as Play new, so the game-over message, centred, and the button pushing it out are on one line */
	.actions {
		display: grid;
		height: 50px;
		place-items: center;
	}

	.actions > :global(*) {
		grid-area: 1/1;
	}

	.pair {
		display: grid;
		grid-auto-flow: column;
		gap: 12px;
	}

	/* about as wide as the map above it; if it takes two lines, they're of a length */
	.over {
		width: 360px;
		text-align: center;
		text-wrap: balance;
		font-family: SR;
		font-size: 21px;
		color: #d8d2ff;
	}

	.over.won {
		font-family: CZ;
		font-size: 24px;
		color: #ffd77a;
		text-shadow: 0 0 14px #ffd77a88;
	}
</style>
