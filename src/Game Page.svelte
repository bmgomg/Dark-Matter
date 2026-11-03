<script>
	import Actions from './Actions.svelte';
	import Board from './Board.svelte';
	import Horizon from './Horizon.svelte';
	import Palette from './Palette.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import { ss } from './shared.svelte';
	import Toolbar from './Toolbar.svelte';
</script>

<div class="game-page ga11" class:show={!ss.home} inert={ss.home}>
	<Scoreboard />

	<div class="stage" class:dim={ss.generating}>
		{#if ss.pzl}
			<Board />
			<Horizon />
		{:else}
			<div class="charting">charting the sky…</div>
		{/if}
	</div>

	<Palette />
	<Actions />
	<Toolbar />
</div>

<style>
	.game-page {
		display: grid;
		grid-template-rows: auto 1fr auto auto auto;
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
		align-content: center;
		justify-items: center;
		transition: opacity 0.3s;
	}

	.dim {
		opacity: 0.35;
	}

	.charting {
		font-family: SM;
		font-size: 12px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #b8b0ff;
	}
</style>
