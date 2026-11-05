<script>
	import { MSG_THINK_TWICE } from './const';
	import { ss } from './shared.svelte';

	// Down by the palette: with a cell selected, or the keyboard's cursor on one (a number key marks it at once), the
	// warning that changing a mark costs; otherwise what to do next, in the palette's place. The game-over message is the
	// prompts' (Actions).
	const message = $derived.by(() => {
		if (ss.sel || ss.cursorOn) {
			return MSG_THINK_TWICE;
		}

		if (ss.generating) {
			return 'Charting a new sky…';
		}

		if (!ss.swiped) {
			return 'Swipe the planets below the map to turn it.';
		}

		return 'Tap a cell to place a planet. Blank cells count as empty.';
	});
</script>

<div class="message">{message}</div>

<style>
	.message {
		width: 365px;
		text-align: center;
		font-family: SI;
		font-size: 20px;
		line-height: 1.35;
		color: #d8d2ff;
	}
</style>
