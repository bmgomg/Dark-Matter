<script>
	import { fade } from 'svelte/transition';
	import { OVER_MS, PROMPT_PLAY_NEW, PROMPT_RESET_STATS, PROMPT_SURRENDER } from './const';
	import { isOver, playNew, resetStats, reveal, ss } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	// in the palette's place: the answers to a prompt, or, at the end of a game, its message for a while, then Play new
	const PILL = 'font-size: 12px; letter-spacing: 0.06em; padding: 11px 18px;';

	let lingering = $state(false);

	$effect(() => {
		if (ss.prompt !== PROMPT_PLAY_NEW || !ss.overAt) {
			lingering = false;
			return;
		}

		const left = OVER_MS - (Date.now() - ss.overAt);
		lingering = left > 0;

		if (lingering) {
			const id = setTimeout(() => (lingering = false), left);
			return () => clearTimeout(id);
		}
	});

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
		<div class="pair" in:fade={{ duration: 200 }}>
			<TextButton text={[PROMPT_SURRENDER]} framed style={PILL} onClick={reveal} />
			<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
		</div>
	{:else if ss.prompt === PROMPT_RESET_STATS}
		<div class="pair" in:fade={{ duration: 200 }}>
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
		<div class="over" class:won={ss.pzl?.over === 'won'} in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>{ss.message}</div>
	{:else if ss.prompt === PROMPT_PLAY_NEW}
		<div in:fade={{ duration: 300, delay: 200 }}>
			<TextButton text={['play new']} framed onClick={playNew} />
		</div>
	{/if}
</div>

<style>
	/* as tall as Play new, so the game-over message, centred, stays put while the button fades in over it */
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

	.over {
		width: 420px;
		text-align: center;
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
