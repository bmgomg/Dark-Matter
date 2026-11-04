<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { R, TAGLINE, TITLE } from './const';
	import Emblem from './Emblem.svelte';
	import Planet from './Planet.svelte';
	import { loadCommon, ss } from './shared.svelte';
	import TextButton from './Text Button.svelte';

	onMount(loadCommon);

	const RULES = [
		[1, 'Planets of three sizes hide on a square board, at most one to a cell.'],
		[2, 'You see the board <em>edge-on</em>, one side at a time. Swipe the edge to turn the board.'],
		[3, 'A planet eclipses anything its size or smaller behind it. A bigger one still shows around it.'],
		[0, 'Map every planet. The game ends once your map is right.']
	];

	// to the launcher, to pick the board and the difficulty
	const play = () => {
		ss.launcher = true;
		delete ss.home;
	};
</script>

{#if ss.home}
	<div class="home ga11" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
		<div class="hero">
			<Emblem />
		</div>

		<div class="titles">
			<div class="tagline">{TAGLINE}</div>
			<div class="title">
				<div>{TITLE[0]}</div>
				<div class="title-2">{TITLE[1]}</div>
			</div>
		</div>

		<ul class="rules">
			{#each RULES as [size, text], i (i)}
				<li>
					<svg viewBox="-12 -12 24 24" class="bullet">
						{#if size}
							<Planet x={0} y={0} r={(R[size] / R[3]) * 10} {size} />
						{:else}
							<circle r="3" class="dot" />
						{/if}
					</svg>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<span>{@html text}</span>
				</li>
			{/each}
		</ul>

		<div class="play">
			<TextButton text={['play']} framed style="width: 150px; padding: 13px 0; font-size: 16px; letter-spacing: 0.3em;" onClick={play} />
		</div>
	</div>
{/if}

<style>
	.home {
		display: grid;
		grid-template-rows: 1fr auto auto auto 1fr;
		justify-items: center;
		width: 450px;
		height: 800px;
		z-index: 1;
	}

	.hero {
		align-self: end;
		margin-bottom: 4px;
	}

	.titles {
		display: grid;
		justify-items: center;
		gap: 8px;
	}

	.tagline {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.34em;
		text-transform: uppercase;
		color: #ffd77a;
	}

	.title {
		font-family: CZ;
		font-size: 44px;
		line-height: 1;
		text-align: center;
		color: #fff4dc;
		text-shadow:
			0 0 18px #ffd77a66,
			0 0 40px #b06bff55;
	}

	.title-2 {
		font-size: 28px;
		margin-top: 6px;
		letter-spacing: 0.06em;
	}

	.rules {
		list-style: none;
		margin: 30px 0 0;
		padding: 0;
		width: 380px;
		display: grid;
		gap: 12px;
	}

	li {
		display: grid;
		grid-template-columns: 24px 1fr;
		gap: 12px;
		align-items: start;
		font-family: QS;
		font-size: 17px;
		line-height: 1.3;
		color: #ece8ff;
	}

	li :global(em) {
		font-style: normal;
		color: #ffd77a;
	}

	.bullet {
		width: 24px;
		height: 24px;
		overflow: visible;
	}

	.dot {
		fill: #ffd77a;
	}

	.play {
		align-self: start;
		margin-top: 40px;
	}
</style>
