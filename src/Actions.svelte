<script>
	import { fade } from 'svelte/transition';
	import { PROMPT_PLAY_NEW, PROMPT_RESET_STATS, PROMPT_SURRENDER, PROMPT_WRONG } from './const';
	import { isOver, newPuzzle, onDone, resetStats, reveal, ss } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	// the message line, then Done, or the answer to the prompt standing in for it
	const PILL = 'font-size: 12px; letter-spacing: 0.16em; padding: 11px 18px;';

	const message = $derived.by(() => {
		if (ss.prompt === PROMPT_SURRENDER || ss.prompt === PROMPT_RESET_STATS) {
			return ss.prompt;
		}

		if (ss.message) {
			return ss.message;
		}

		if (ss.generating) {
			return 'Charting a new sky…';
		}

		if (!ss.swiped) {
			return 'Swipe the board to turn it.';
		}

		return 'Map every planet, then tap Done.';
	});

	const dismiss = () => {
		const over = isOver();
		delete ss.prompt;

		if (over) {
			ss.prompt = PROMPT_PLAY_NEW;
		}
	};
</script>

<div class="actions">
	{#key message}
		<div class="message" class:won={ss.pzl?.over === 'won'} in:fade={{ duration: 250 }}>{message}</div>
	{/key}

	<div class="row">
		{#if ss.prompt === PROMPT_WRONG}
			<div class="pair" in:fade={{ duration: 200 }}>
				<TextButton text={['keep looking']} framed style={PILL} onClick={() => delete ss.prompt} />
				<TextButton text={['show solution']} framed style={PILL} onClick={reveal} />
			</div>
		{:else if ss.prompt === PROMPT_SURRENDER}
			<div class="pair" in:fade={{ duration: 200 }}>
				<TextButton text={['yes, show it']} framed style={PILL} onClick={reveal} />
				<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
			</div>
		{:else if ss.prompt === PROMPT_RESET_STATS}
			<div class="pair" in:fade={{ duration: 200 }}>
				<TextButton
					text={['reset']}
					framed
					style={PILL}
					onClick={() => {
						resetStats();
						dismiss();
					}}
				/>
				<TextButton text={['no']} framed style={PILL} onClick={dismiss} />
			</div>
		{:else if ss.prompt === PROMPT_PLAY_NEW}
			<div in:fade={{ duration: 300, delay: 600 }}>
				<TextButton text={['play new']} framed onClick={newPuzzle} />
			</div>
		{:else}
			<TextButton text={['done']} framed disabled={!ss.pzl || ss.generating} onClick={onDone} />
		{/if}
	</div>
</div>

<style>
	.actions {
		display: grid;
		grid-template-rows: 44px 60px;
		align-items: center;
	}

	.message {
		grid-area: 1/1;
		justify-self: center;
		width: 400px;
		text-align: center;
		font-family: QS;
		font-size: 19px;
		color: #d8d2ff;
	}

	.message.won {
		font-family: CZ;
		font-size: 22px;
		color: #ffd77a;
		text-shadow: 0 0 14px #ffd77a88;
	}

	.row {
		grid-area: 2/1;
		display: grid;
		place-items: center;
	}

	.pair {
		display: grid;
		grid-auto-flow: column;
		gap: 14px;
	}
</style>
