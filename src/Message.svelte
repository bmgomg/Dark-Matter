<script>
	import { fade } from 'svelte/transition';
	import { isOver, ss } from './shared.svelte';

	// the line above the board: what to do next, or how a Done went; the game-over message is down by the buttons
	const message = $derived.by(() => {
		if (isOver()) {
			return '';
		}

		if (ss.message) {
			return ss.message;
		}

		if (ss.generating) {
			return 'Charting a new sky…';
		}

		if (!ss.swiped) {
			return 'Swipe the tray to turn the board.';
		}

		return 'Map every planet, then tap Done.';
	});
</script>

<div class="message-line">
	{#key message}
		<div class="message" in:fade={{ duration: 250 }}>{message}</div>
	{/key}
</div>

<style>
	.message-line {
		display: grid;
		height: 34px;
		align-items: center;
	}

	.message {
		grid-area: 1/1;
		justify-self: center;
		width: 400px;
		text-align: center;
		font-family: QS;
		font-size: 18px;
		color: #d8d2ff;
	}
</style>
