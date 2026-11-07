<script>
	import Actions from './Actions.svelte';
	import Board from './Board.svelte';
	import Keys from './Keys.svelte';
	import Launcher from './Launcher.svelte';
	import Message from './Message.svelte';
	import Tray from './Tray.svelte';
	import Palette from './Palette.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import { PAGE_SLIDE_MS, PALETTE_AT_CELL, STRIP_SLIDE_MS } from './const';
	import { ss } from './shared.svelte';
	import Toolbar from './Toolbar.svelte';
	import { pushIn, pushOut, slideX, wayAlong } from './utils';

	// what the space below the tray holds: a prompt's answers (a game over is always one: Play new), the palette
	// with its warning while a cell is selected, or else what to do next
	const mode = $derived(ss.prompt ? 'prompt' : ss.sel ? 'palette' : 'hint');

	// one pushes another, as the pages do, these three standing in a row in this order: a cell selected pushes the hint
	// off to the left, and letting it go brings it back from there
	const MODES = ['hint', 'palette', 'prompt'];
	const along = wayAlong();
	const way = $derived(along(MODES.indexOf(mode)));
	// (read from the start, so the first change knows where it came from)
	$effect(() => void way);

	// the pages stand in a row, Home, the launcher, a game: the launcher comes and goes on its left, a game on its right
	const push = (from) => ({ from, unit: '%', duration: PAGE_SLIDE_MS });
</script>

<!-- the launcher (between Home and a game), or the game itself, above the toolbar; all of it, toolbar too, waits on
     Home's right -->
<div class="game-page ga11" class:show={!ss.home} inert={ss.home}>
	{#if ss.launcher}
		<div class="ga11 launching" transition:slideX={push(-100)}>
			<div class="ga11"><Launcher /></div>
			<!-- the music's license requires a credit in the game itself -->
			<div class="ga11 credit">Music by Eric Matyas · www.soundimage.org</div>
		</div>
	{:else}
		<div class="ga11 game" transition:slideX={push(100)}>
			<Scoreboard />

			<div class="stage" class:dim={ss.generating}>
				{#if ss.pzl}
					<Board />
					<Tray />
				{:else}
					<div class="charting">charting the sky…</div>
				{/if}
			</div>

			<div class="controls">
				{#if mode === 'prompt'}
					<div class="ga11" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}><Actions /></div>
				{:else if mode === 'palette'}
					<div class="ga11 marking" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}>
						<Message />
						{#if !PALETTE_AT_CELL}
							<Palette />
						{/if}
					</div>
				{:else}
					<div class="ga11" in:slideX={pushIn(way, STRIP_SLIDE_MS)} out:slideX={pushOut(way, STRIP_SLIDE_MS)}><Message /></div>
				{/if}
			</div>
		</div>
	{/if}
	{#if ss.keys}
		<Keys />
	{/if}
	<Toolbar />
</div>

<style>
	.game-page {
		display: grid;
		grid-template-rows: 1fr auto;
		width: 450px;
		height: 800px;
		translate: 100% 0;
		pointer-events: none;
		/* as slideX: PAGE_SLIDE_MS, cubicInOut */
		transition: translate 0.5s cubic-bezier(0.65, 0, 0.35, 1);
	}

	.show {
		translate: 0 0;
		pointer-events: auto;
	}

	.game {
		display: grid;
		grid-template-rows: auto auto 1fr;
		min-height: 0;
	}

	.launching {
		display: grid;
		place-items: center;
	}

	.credit {
		align-self: end;
		padding-bottom: 14px;
		font-family: SI;
		font-size: 14px;
		color: #b8b0ff;
	}

	.stage {
		display: grid;
		justify-items: center;
		padding-top: 30px;
		transition: opacity 0.3s;
	}

	.dim {
		opacity: 0.35;
	}

	/* the rest of the page's height, whatever is in it centred */
	.controls {
		display: grid;
		place-items: center;
	}

	.marking {
		display: grid;
		justify-items: center;
		gap: 12px;
	}

	.charting {
		font-family: SM;
		font-size: 12px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #b8b0ff;
	}
</style>
