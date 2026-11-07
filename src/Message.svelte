<script>
	import { MSG_THINK_TWICE, STRIP_SLIDE_MS } from './const';
	import { ss } from './shared.svelte';
	import { pushIn, pushOut, slideX } from './utils';

	const SWIPE = 'Swipe the planets or tap the arrows to turn the map 90°. Hold an arrow to turn 180°.';
	const TAP = 'Tap a cell to place a planet. Blank cells count as empty.';

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

		return ss.swiped ? TAP : SWIPE;
	});

	// Having turned the board, the player moves on to the next hint: it pushes the old one off to the left. Any other
	// change is at once.
	let last;

	const shown = $derived.by(() => {
		const moved = last === SWIPE && message === TAP;

		last = message;
		return { text: message, moved };
	});

	// By requestAnimationFrame, not CSS: it comes as a turn lands, and may meet the next turn; on a Pixel 6a an animation on
	// the compositor makes a turn stagger (see Roller Digit).
	const swap = (node, { moved, params }) => (moved ? slideX(node, params) : { duration: 0 });
</script>

<div class="message">
	{#key shown.text}
		<div class="text" in:swap={{ moved: shown.moved, params: pushIn(1, STRIP_SLIDE_MS, true) }}
			out:swap={{ moved: shown.moved, params: pushOut(1, STRIP_SLIDE_MS, true) }}>{shown.text}</div>
	{/key}
</div>

<style>
	.message {
		display: grid;
		width: 365px;
		text-align: center;
		font-family: SI;
		font-size: 20px;
		line-height: 1.35;
		color: #d8d2ff;
	}

	/* in one place, while one pushes the other out */
	.text {
		grid-area: 1 / 1;
	}
</style>
