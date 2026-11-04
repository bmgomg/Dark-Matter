<script>
	import { fade } from 'svelte/transition';
	import Actions from './Actions.svelte';
	import Board from './Board.svelte';
	import Keys from './Keys.svelte';
	import Launcher from './Launcher.svelte';
	import Message from './Message.svelte';
	import Tray from './Tray.svelte';
	import Palette from './Palette.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import { PAGE_FADE_MS, PALETTE_AT_CELL } from './const';
	import { ss } from './shared.svelte';
	import Toolbar from './Toolbar.svelte';

	// what the space below the tray holds: a prompt's answers (a game over is always one: Play new), the palette
	// with its warning while a cell is selected, or else what to do next
	const mode = $derived(ss.prompt ? 'prompt' : ss.sel ? 'palette' : 'hint');
</script>

<!-- the launcher (between Home and a game), or the game itself, above the toolbar -->
<div class="game-page ga11" class:show={!ss.home} inert={ss.home}>
	{#if ss.launcher}
		<div class="ga11 launching" in:fade={{ duration: 250 }} out:fade={{ duration: 150 }}><Launcher /></div>
	{:else}
		<div class="ga11 game" in:fade={{ duration: PAGE_FADE_MS }} out:fade={{ duration: 150 }}>
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
					<div class="ga11" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}><Actions /></div>
				{:else if mode === 'palette'}
					<div class="ga11 marking" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}>
						<Message />
						{#if !PALETTE_AT_CELL}
							<Palette />
						{/if}
					</div>
				{:else}
					<div class="ga11" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}><Message /></div>
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
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
	}

	.show {
		opacity: 1;
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
