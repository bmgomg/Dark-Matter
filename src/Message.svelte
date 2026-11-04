<script>
	import { fade } from 'svelte/transition';
	import { isOver, ss } from './shared.svelte';

	// the line above the board: what to do next; the game-over message is down by the buttons
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
			return 'Swipe the planets below the map to turn it.';
		}

		return 'Map every planet. Blank cells count as empty.';
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
