<script>
	import { fade } from 'svelte/transition';
	import Actions from './Actions.svelte';
	import Board from './Board.svelte';
	import Message from './Message.svelte';
	import Tray from './Tray.svelte';
	import Palette from './Palette.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import { ss } from './shared.svelte';
	import Toolbar from './Toolbar.svelte';
</script>

<div class="game-page ga11" class:show={!ss.home} inert={ss.home}>
	<Scoreboard />
	<Message />

	<div class="stage" class:dim={ss.generating}>
		{#if ss.pzl}
			<Board />
			<Tray />
		{:else}
			<div class="charting">charting the sky…</div>
		{/if}
	</div>

	<!-- a faint line, halfway between the planets' ground and the palette -->
	<div class="gap"><div class="separator"></div></div>

	<!-- the palette, or a prompt's answers in its place (a game over is always one: Play new) -->
	<div class="controls">
		{#if ss.prompt}
			<div class="ga11" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}><Actions /></div>
		{:else}
			<div class="ga11" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}><Palette /></div>
		{/if}
	</div>
	<Toolbar />
</div>

<style>
	.game-page {
		display: grid;
		grid-template-rows: auto auto auto 1fr auto auto;
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

	.stage {
		display: grid;
		justify-items: center;
		padding-top: 32px;
		transition: opacity 0.3s;
	}

	.dim {
		opacity: 0.35;
	}

	/* the rest of the page's height, with the line in its middle; the tray ends 10px below its ground, so the line
	   sits 5px above the row's middle, to be halfway from the ground to the palette */
	.gap {
		display: grid;
		align-items: center;
	}

	.separator {
		width: 410px;
		height: 1px;
		margin: 0 auto;
		background: #8f86ff33;
		translate: 0 -5px;
	}

	.controls {
		display: grid;
		height: 84px;
		place-items: start center;
	}

	.charting {
		font-family: SM;
		font-size: 12px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #b8b0ff;
	}
</style>
