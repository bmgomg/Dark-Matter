<script>
	import { msToMidnight } from './logic';
	import { ss } from './shared.svelte';

	// how long till the daily's next puzzle, which is midnight where the player is
	const left = $derived.by(() => {
		const seconds = Math.ceil(msToMidnight(ss.now) / 1000);
		const two = (v) => String(v).padStart(2, '0');

		return `${two(Math.floor(seconds / 3600))}:${two(Math.floor(seconds / 60) % 60)}:${two(seconds % 60)}`;
	});
</script>

<div class="countdown">
	<span class="label">next puzzle in</span>
	<span class="time">{left}</span>
</div>

<style>
	.countdown {
		display: grid;
		grid-auto-flow: column;
		align-items: center;
		gap: 10px;
	}

	.label {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: #b8b0ff;
	}

	/* Space Mono: every digit the same width, so it holds still as the seconds go by */
	.time {
		font-family: SM;
		font-size: 16px;
		color: #ffd77a;
	}
</style>
